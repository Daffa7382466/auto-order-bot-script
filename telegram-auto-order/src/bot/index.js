const {Telegraf}=require('telegraf');
const fs=require('fs'); const os=require('os'); const path=require('path');
const config=require('../config/config');
const pages=require('../ui/pages');
const {sendRich,editRich,sendRichToChat}=require('../ui/richMessage');
const {validateConfig}=require('../utils/validator');
const {createOrder,getOrder,updateOrder,calculateRegularFee,calculateLegalFee,calculateTotal,warrantyInfo}=require('../services/order.service');
const {markProofSubmitted,approvePayment,rejectPayment}=require('../services/payment.service');
const {provision}=require('../services/provisioning.service');
const {createRequest}=require('../services/support.service');
const {createReplacementRequest}=require('../services/replacement.service');
const {startChat,isActive}=require('../services/relay.service');
const {createRating,labels}=require('../services/rating.service');
const {addNoktel,listAvailable,getItem:getNoktelItem,updateItem:updateInventoryItem}=require('../services/noktel.service');
const {addScript}=require('../services/script.service');
const {archiveCompletedOrder}=require('../services/invoice.service');
const {rupiah,cleanUsername}=require('../utils/format');

const errors=validateConfig(config); if(errors.length) console.warn('[CONFIG]',errors.join(' | '));
if(!config.botToken){console.error('BOT_TOKEN belum diisi di .env');process.exit(1);}
const bot=new Telegraf(config.botToken); const state=new Map();
const admins=new Set(String(process.env.ADMIN_TELEGRAM_IDS||'').split(',').map(x=>x.trim()).filter(Boolean));
if(config.owner.id)admins.add(String(config.owner.id));
function isOwnerOrAdmin(ctx){return admins.has(String(ctx.from.id));}
function setState(id,data){state.set(String(id),data);} function getState(id){return state.get(String(id));} function clearState(id){state.delete(String(id));}
async function resolvePremiumEmoji(){const ids=[...new Set(Object.values(config.emoji).filter(Boolean))];try{const stickers=await bot.telegram.callApi('getCustomEmojiStickers',{custom_emoji_ids:ids});const map=new Map((stickers||[]).map(s=>[String(s.custom_emoji_id),s]));config.emojiResolved={};for(const[k,id]of Object.entries(config.emoji)){const s=map.get(String(id));if(s)config.emojiResolved[k]={id:String(id),alternative:s.emoji||''};}console.log(`[EMOJI] ${map.size}/${ids.length} resolved`);}catch(e){console.warn('[EMOJI]',e.message);}}
async function sendPage(ctx,html){return sendRich(ctx,html,{header:true});}
async function editPage(ctx,html){return editRich(ctx,html,{header:true});}
async function ownerText(text,extra={}){if(!config.owner.id)return;return bot.telegram.sendMessage(config.owner.id,text,{parse_mode:'HTML',...extra});}
async function ownerRich(html){if(!config.owner.id)return;return sendRichToChat(bot.telegram,config.owner.id,html);}
async function notifyUser(userId,text,extra={}){return bot.telegram.sendMessage(userId,text,{parse_mode:'HTML',...extra});}

bot.start(async ctx=>{clearState(ctx.from.id);await sendPage(ctx,pages.home(ctx.from));});
bot.command('help',async ctx=>sendPage(ctx,pages.help()));

bot.action('home:products',async ctx=>{await ctx.answerCbQuery();await editPage(ctx,pages.products());});
bot.action('home:support',async ctx=>{await ctx.answerCbQuery();await editPage(ctx,pages.support());});
bot.action('home:help',async ctx=>{await ctx.answerCbQuery();await editPage(ctx,pages.help());});
bot.action('home:rating',async ctx=>{await ctx.answerCbQuery();await editPage(ctx,pages.rating());});
bot.action('home:other',async ctx=>{await ctx.answerCbQuery();await editPage(ctx,pages.other());});
bot.action('home:back',async ctx=>{await ctx.answerCbQuery();clearState(ctx.from.id);await editPage(ctx,pages.home(ctx.from));});
bot.action('product:vps',async ctx=>{await ctx.answerCbQuery();await editPage(ctx,pages.provider(false));});
bot.action('product:legal',async ctx=>{await ctx.answerCbQuery();await editPage(ctx,pages.provider(true));});
bot.action('product:noktel',async ctx=>{await ctx.answerCbQuery();await editPage(ctx,pages.noktel(listAvailable('noktel')));});
bot.action('product:script',async ctx=>{await ctx.answerCbQuery();await editPage(ctx,pages.script(listAvailable('script')));});

bot.action(/^vps:provider:(digitalocean|linode)$/,async ctx=>{await ctx.answerCbQuery();const provider=ctx.match[1];const available=config.mode==='exhibition'||Object.values(config.providers[provider].keys).some(Boolean);if(!available)return ctx.reply('Provider belum tersedia untuk Regular VPS.');await editPage(ctx,pages.warranty(provider));});
bot.action(/^vps:warranty:(digitalocean|linode):(low|standard|high|super|gold)$/,async ctx=>{await ctx.answerCbQuery();const[,provider,warranty]=ctx.match;const key=config.providers[provider].keys[warranty];if(config.mode==='production'&&!key)return ctx.reply(`Paket ${warranty} belum tersedia.`);setState(ctx.from.id,{type:'regular',provider,warranty});await editPage(ctx,pages.spec({provider}));});
bot.action(/^vps:spec:(digitalocean|linode):([a-z0-9]+)$/,async ctx=>{await ctx.answerCbQuery();const[,provider,spec]=ctx.match;const s=getState(ctx.from.id)||{};if(!s.warranty)return editPage(ctx,pages.warranty(provider));setState(ctx.from.id,{...s,provider,spec});await editPage(ctx,pages.region({provider,spec}));});
bot.action(/^vps:region:(digitalocean|linode):([a-z0-9]+):([a-z0-9]+)$/,async ctx=>{await ctx.answerCbQuery();const[,provider,spec,region]=ctx.match;const s=getState(ctx.from.id)||{};setState(ctx.from.id,{...s,provider,spec,region});await editPage(ctx,pages.os({provider,spec,region}));});
bot.action(/^vps:os:(digitalocean|linode):([a-z0-9]+):([a-z0-9]+):([a-z0-9]+)$/,async ctx=>{await ctx.answerCbQuery();const[,provider,spec,region,osName]=ctx.match;const s=getState(ctx.from.id)||{};const items=calculateRegularFee({provider,warranty:s.warranty,spec,region,os:osName});const w=warrantyInfo(s.warranty);const order=createOrder({userId:ctx.from.id,username:cleanUsername(ctx.from.username),type:'vps',legal:false,provider,warranty:s.warranty,warrantyName:w.name,warrantyDays:w.days,replace:w.replace,spec,region,os:osName,feeItems:items,total:calculateTotal(items)});setState(ctx.from.id,{type:'payment',orderId:order.id});await editPage(ctx,pages.summary(order));});

bot.action(/^noktel:buy:(.+)$/,async ctx=>{await ctx.answerCbQuery();const item=getNoktelItem(ctx.match[1]);if(!item||item.status!=='available')return ctx.reply('Noktel sudah tidak tersedia.');const total=Number(String(item.price).replace(/\./g,''));const order=createOrder({userId:ctx.from.id,username:cleanUsername(ctx.from.username),type:'noktel',noktelName:item.name,noktelNumber:item.number,noktelPrice:item.price,inventoryId:item.id,total,feeItems:[{label:'Noktel',amount:total}]});updateInventoryItem(item.id,{status:'reserved',reservedOrderId:order.id});setState(ctx.from.id,{type:'payment',orderId:order.id});await editPage(ctx,pages.summary(order));});
bot.action(/^script:buy:(.+)$/,async ctx=>{await ctx.answerCbQuery();const item=listAvailable('script').find(x=>x.id===ctx.match[1]);if(!item)return ctx.reply('Script sudah tidak tersedia.');const total=Number(String(item.price).replace(/\./g,''));const order=createOrder({userId:ctx.from.id,username:cleanUsername(ctx.from.username),type:'script',scriptName:item.name,scriptDescription:item.description,scriptTutorial:item.tutorial,scriptFilePath:item.filePath,inventoryId:item.id,total,feeItems:[{label:'Script',amount:total}]});updateInventoryItem(item.id,{status:'reserved',reservedOrderId:order.id});setState(ctx.from.id,{type:'payment',orderId:order.id});await editPage(ctx,pages.summary(order));});

bot.action(/^legal:provider:(digitalocean|linode)$/,async ctx=>{await ctx.answerCbQuery();const provider=ctx.match[1];if(config.mode==='production'&&!config.providers[provider].legalApi)return ctx.reply('VPS Legal belum tersedia untuk provider ini.');setState(ctx.from.id,{type:'legal',provider});await editPage(ctx,pages.spec({provider,legal:true}));});
bot.action(/^legal:spec:(digitalocean|linode):([a-z0-9]+)$/,async ctx=>{await ctx.answerCbQuery();const[,provider,spec]=ctx.match;setState(ctx.from.id,{type:'legal',provider,spec});await editPage(ctx,pages.region({provider,spec,legal:true}));});
bot.action(/^legal:region:(digitalocean|linode):([a-z0-9]+):([a-z0-9]+)$/,async ctx=>{await ctx.answerCbQuery();const[,provider,spec,region]=ctx.match;setState(ctx.from.id,{type:'legal',provider,spec,region});await editPage(ctx,pages.os({provider,spec,region,legal:true}));});
bot.action(/^legal:os:(digitalocean|linode):([a-z0-9]+):([a-z0-9]+):([a-z0-9]+)$/,async ctx=>{await ctx.answerCbQuery();const[,provider,spec,region,osName]=ctx.match;const items=calculateLegalFee({provider,spec,region,os:osName});const order=createOrder({userId:ctx.from.id,username:cleanUsername(ctx.from.username),type:'vps_legal',legal:true,provider,spec,region,os:osName,feeItems:items,total:calculateTotal(items),warranty:null});setState(ctx.from.id,{type:'payment',orderId:order.id});await editPage(ctx,pages.summary(order));});

bot.action(/^order:confirm:(.+)$/,async ctx=>{await ctx.answerCbQuery();const order=getOrder(ctx.match[1]);if(!order)return ctx.reply('Order tidak ditemukan.');if(order.userId!==ctx.from.id)return ctx.reply('Order ini bukan milik Anda.');updateOrder(order.id,{status:'awaiting_payment'});setState(ctx.from.id,{type:'payment_proof',orderId:order.id});if(config.payment.qris){try{await ctx.replyWithPhoto(config.payment.qris,{caption:`Payment • ${rupiah(order.total)}\nOrder: ${order.id}`});}catch(e){console.warn('[QRIS]',e.message);}}await editPage(ctx,pages.payment(order));});

bot.action('support:chat',async ctx=>{await ctx.answerCbQuery();startChat(ctx.from.id);setState(ctx.from.id,{type:'support_chat'});await ctx.reply('Chat Admin aktif. Kirim pesan Anda. Gunakan /start untuk keluar.');});
bot.action('support:reff',async ctx=>{await ctx.answerCbQuery();setState(ctx.from.id,{type:'reff_product'});await ctx.reply('Ketik nama produk untuk Minta Reff.');});
bot.action('support:replace',async ctx=>{await ctx.answerCbQuery();setState(ctx.from.id,{type:'replace_order'});await ctx.reply('Ketik Order ID VPS yang ingin diajukan replacement.');});

bot.action(/^rating:score:([1-5])$/,async ctx=>{await ctx.answerCbQuery();const score=Number(ctx.match[1]);setState(ctx.from.id,{type:'rating_feedback',score});await editPage(ctx,pages.ratingFeedback(score));});

bot.action(/^owner:payment:approve:(.+)$/,async ctx=>{
 if(!isOwnerOrAdmin(ctx))return ctx.answerCbQuery('Not authorized',{show_alert:true});
 await ctx.answerCbQuery('Payment approved');
 const order=getOrder(ctx.match[1]); if(!order)return;
 approvePayment(order.id);
 try{
  if(order.type==='noktel'){
   updateOrder(order.id,{status:'payment_approved'});
   await notifyUser(order.userId,`<b>Payment confirmed.</b>\n\nNoktel: <code>${escapeHtml(order.noktelNumber)}</code>\nOrder: <code>${order.id}</code>\n\nLanjutkan handoff dengan owner melalui Support / Chat Admin.`);
   await ownerRich(`<h1>${require('../ui/richMessage').emoji('PRODUCT')} Noktel Payment Confirmed</h1><p>Order: <code>${order.id}</code><br/>Buyer ID: <code>${order.userId}</code><br/>Noktel: <code>${escapeHtml(order.noktelNumber)}</code></p><hr/>${require('../ui/richMessage').row(require('../ui/richMessage').button('TRANSAKSI SELESAI',`owner:noktel:done:${order.id}`,'success','CHECK'),require('../ui/richMessage').button('TRANSAKSI DIBATALKAN',`owner:noktel:cancel:${order.id}`,'danger','CROSS'))}`);
   return;
  }
  if(order.type==='script'){
   updateOrder(order.id,{status:'completed',completedAt:new Date().toISOString()});
   if(order.inventoryId)updateInventoryItem(order.inventoryId,{status:'sold',soldOrderId:order.id});
   if(order.scriptFilePath && fs.existsSync(order.scriptFilePath))await bot.telegram.sendDocument(order.userId,{source:order.scriptFilePath},{caption:`Script: ${order.scriptName}\nOrder: ${order.id}`});
   await notifyUser(order.userId,`<b>Script delivery completed.</b>\nOrder: <code>${order.id}</code>`);
   await archiveCompletedOrder(bot.telegram,updateOrder(order.id,{}));
   return;
  }
  const result=await provision(order);
  updateOrder(order.id,{status:'completed',provisionResult:{id:result.id,ip:result.ip,username:result.username},completedAt:new Date().toISOString()});
  if(order.inventoryId)updateInventoryItem(order.inventoryId,{status:'sold',soldOrderId:order.id});
  await notifyUser(order.userId,`<b>Payment confirmed</b>\n\nOrder: <code>${order.id}</code>\nIP: <code>${result.ip||'-'}</code>\nUsername: <code>${result.username||'root'}</code>\nPassword: <code>${result.password||'-'}</code>`);
  await archiveCompletedOrder(bot.telegram,updateOrder(order.id,{}));
  await ownerRich(`<h1>Payment Approved</h1><p>Order <code>${order.id}</code> completed.</p><p>IP: <code>${result.ip||'-'}</code></p><hr/>`);
 }catch(e){
  updateOrder(order.id,{status:'provisioning_failed',provisioningError:e.message});
  if(order.inventoryId)updateInventoryItem(order.inventoryId,{status:'available',reservedOrderId:null});
  await notifyUser(order.userId,`<b>Payment confirmed</b>, tetapi proses delivery/provisioning gagal.\nOrder: <code>${order.id}</code>\nOwner sedang menangani masalah.`);
  await ownerText(`<b>PROCESSING FAILED</b>\nOrder: <code>${order.id}</code>\nError: ${escapeHtml(e.message)}`);
 }
});
bot.action(/^owner:payment:reject:(.+)$/,async ctx=>{if(!isOwnerOrAdmin(ctx))return ctx.answerCbQuery('Not authorized',{show_alert:true});await ctx.answerCbQuery();setState(ctx.from.id,{type:'owner_reject_payment',orderId:ctx.match[1]});await ctx.reply('Ketik alasan penolakan pembayaran.');});

bot.action(/^owner:noktel:done:(.+)$/,async ctx=>{if(!isOwnerOrAdmin(ctx))return ctx.answerCbQuery('Not authorized',{show_alert:true});await ctx.answerCbQuery();const order=getOrder(ctx.match[1]);if(!order)return;updateOrder(order.id,{status:'completed',completedAt:new Date().toISOString()});if(order.inventoryId)updateInventoryItem(order.inventoryId,{status:'sold',soldOrderId:order.id});await notifyUser(order.userId,`<b>Transaksi Noktel selesai.</b>\nOrder: <code>${order.id}</code>`);await archiveCompletedOrder(bot.telegram,updateOrder(order.id,{}));});
bot.action(/^owner:noktel:cancel:(.+)$/,async ctx=>{if(!isOwnerOrAdmin(ctx))return ctx.answerCbQuery('Not authorized',{show_alert:true});await ctx.answerCbQuery();setState(ctx.from.id,{type:'owner_cancel_noktel',orderId:ctx.match[1]});await ctx.reply('Ketik alasan pembatalan transaksi Noktel.');});

bot.on('photo',async ctx=>{const s=getState(ctx.from.id);if(s?.type==='payment_proof'&&s.orderId){const photo=ctx.message.photo.at(-1);const order=markProofSubmitted(s.orderId,photo.file_id);clearState(ctx.from.id);await ctx.reply('Bukti pembayaran diterima. Status: menunggu konfirmasi owner.');if(config.owner.id){await ctx.telegram.sendPhoto(config.owner.id,photo.file_id,{caption:`Payment proof\nOrder: ${order.id}\nUser ID: ${ctx.from.id}\nTotal: ${rupiah(order.total)}`});await sendRichToChat(ctx.telegram,config.owner.id,`<h1>${require('../ui/richMessage').emoji('PAYMENT')} Payment Review</h1><p>Order: <code>${order.id}</code><br/>Buyer ID: <code>${ctx.from.id}</code><br/>Total: <b>${rupiah(order.total)}</b></p><hr/>${require('../ui/richMessage').row(require('../ui/richMessage').button('CONFIRM PAYMENT',`owner:payment:approve:${order.id}`,'success','CHECK'),require('../ui/richMessage').button('REJECT PAYMENT',`owner:payment:reject:${order.id}`,'danger','CROSS'))}`); }return;}
if(s?.type==='replace_screenshot'){s.screenshotFileId=ctx.message.photo.at(-1).file_id;s.type='replace_chronology';setState(ctx.from.id,s);return ctx.reply('Screenshot diterima. Tuliskan kronologi masalah VPS.');}
if(isActive(ctx.from.id))return forwardToOwner(ctx);return ctx.reply('Gunakan /start untuk membuka menu.');});

bot.on('document',async ctx=>{const s=getState(ctx.from.id);if(!isOwnerOrAdmin(ctx)||s?.type!=='addscript')return;if(!ctx.message.document.file_name.toLowerCase().endsWith('.zip'))return ctx.reply('File Script harus .zip.');const file=await ctx.telegram.getFile(ctx.message.document.file_id);const url=`https://api.telegram.org/file/bot${config.botToken}/${file.file_path}`;const tmp=path.join(os.tmpdir(),`noktel-script-${Date.now()}.zip`);const res=await fetch(url);if(!res.ok)throw new Error('Gagal mengambil ZIP dari Telegram.');fs.writeFileSync(tmp,Buffer.from(await res.arrayBuffer()));const d=s.data;const item=addScript({name:d.name,description:d.description,price:d.price,tutorial:d.tutorial,filePath:tmp});clearState(ctx.from.id);return ctx.reply(`Script <b>${d.name}</b> berhasil ditambahkan.\nID: <code>${item.id}</code>`,{parse_mode:'HTML'});});

bot.on('text',async ctx=>{const text=ctx.message.text.trim();const s=getState(ctx.from.id);
 if(text.startsWith('/addscript ')&&isOwnerOrAdmin(ctx)){const parts=text.slice(11).split(',').map(x=>x.trim());if(parts.length<3)return ctx.reply('Format: /addscript [nama], [deskripsi], [harga], [tutorial optional]');const price=parts[2];if(!/^\d{1,3}(\.\d{3})*$/.test(price))return ctx.reply('Harga wajib format seperti 50.000.');setState(ctx.from.id,{type:'addscript',data:{name:parts[0],description:parts[1],price,tutorial:parts.slice(3).join(', ')}});return ctx.reply('Sekarang kirim file <b>.zip</b> script dalam pesan berikutnya.',{parse_mode:'HTML'});}
 if(text.startsWith('/addnoktel ')&&isOwnerOrAdmin(ctx)){const parts=text.slice(11).split(',').map(x=>x.trim());if(parts.length<3)return ctx.reply('Format: /addnoktel [nomor], [nama], [harga], [2FA optional]');const price=parts[2];if(!/^\d{1,3}(\.\d{3})*$/.test(price))return ctx.reply('Harga wajib format seperti 10.000.');const item=addNoktel({number:parts[0],name:parts[1],price,twoFA:parts.slice(3).join(', ')||''});return ctx.reply(`Noktel berhasil masuk inventory.\nID: <code>${item.id}</code>`,{parse_mode:'HTML'});}
 if(s?.type==='owner_reject_payment'){const order=getOrder(s.orderId);if(order){rejectPayment(order.id,text);await notifyUser(order.userId,`<b>Pembayaran ditolak.</b>\nOrder: <code>${order.id}</code>\nAlasan: ${escapeHtml(text)}`);}clearState(ctx.from.id);return ctx.reply('Alasan penolakan tersimpan.');}
 if(s?.type==='owner_cancel_noktel'){const order=getOrder(s.orderId);if(order){updateOrder(order.id,{status:'cancelled',cancellationReason:text});if(order.inventoryId)updateInventoryItem(order.inventoryId,{status:'available',soldOrderId:null});await notifyUser(order.userId,`<b>Transaksi Noktel dibatalkan.</b>\nOrder: <code>${order.id}</code>\nAlasan: ${escapeHtml(text)}`);}clearState(ctx.from.id);return ctx.reply('Pembatalan tersimpan.');}
 if(s?.type==='rating_feedback'){const rating=createRating({userId:ctx.from.id,score:s.score,feedback:text});clearState(ctx.from.id);const rich=`<h1>${require('../ui/richMessage').emoji('STAR')} ${labels[s.score]}</h1><p>Score: <b>${s.score} Stars</b><br/>Feedback: ${escapeHtml(text)}</p><p>Rating ID: <code>${rating.id}</code></p><hr/>`;await ownerRich(rich);if(config.trxChannelId)await sendRichToChat(bot.telegram,config.trxChannelId,rich);return ctx.reply('Terima kasih. Rating dan feedback sudah dikirim.');}
 if(s?.type==='reff_product'){s.product=text;s.type='reff_reason';setState(ctx.from.id,s);return ctx.reply('Jelaskan alasan Minta Reff.');}
 if(s?.type==='reff_reason'){const req=createRequest({type:'reff',userId:ctx.from.id,product:s.product,reason:text});await ownerText(`<b>REQUEST MINTA REFF</b>\nID: <code>${req.id}</code>\nUser ID: <code>${ctx.from.id}</code>\nProduk: ${escapeHtml(s.product)}\nAlasan: ${escapeHtml(text)}`);clearState(ctx.from.id);return ctx.reply('Request terkirim. Tunggu keputusan owner.');}
 if(s?.type==='replace_order'){s.orderId=text;s.type='replace_screenshot';setState(ctx.from.id,s);return ctx.reply('Kirim screenshot terminal VPS.');}
 if(s?.type==='replace_chronology'){s.chronology=text;s.type='replace_current';setState(ctx.from.id,s);return ctx.reply('Jelaskan kondisi VPS saat ini.');}
 if(s?.type==='replace_current'){const req=createReplacementRequest({userId:ctx.from.id,orderId:s.orderId,screenshotFileId:s.screenshotFileId,chronology:s.chronology,currentSituation:text});await ownerText(`<b>REQUEST VPS REPLACE</b>\nID: <code>${req.id}</code>\nOrder: <code>${s.orderId}</code>\nUser ID: <code>${ctx.from.id}</code>\nKronologi: ${escapeHtml(s.chronology)}\nKondisi: ${escapeHtml(text)}`);clearState(ctx.from.id);return ctx.reply('Request replacement terkirim.');}
 if(s?.type==='support_chat'||isActive(ctx.from.id))return forwardToOwner(ctx);
 if(text.startsWith('/fakedana '))return makerPhoto(ctx,'fakedana',{AMOUNT:text.slice(10).trim()});
 if(text.startsWith('/fakeff '))return makerPhoto(ctx,'fakeff',{NAME:text.slice(8).trim()});
 if(text.startsWith('/quotesbook ')){const [a,...b]=text.slice(12).split(',');return makerPhoto(ctx,'quotesmaker',{TEXT:a.trim(),AUTHOR:b.join(',').trim()});}
 if(text.startsWith('/fakerip '))return makerPhoto(ctx,'goodbye',{IMG:'https://cloud.yardansh.com/qhgvcd.jpg',NAME:text.slice(9).trim(),RANDOM:'true'});
 if(text.startsWith('/brat '))return makerSticker(ctx,text.slice(6).trim());
 return ctx.reply('Gunakan /start untuk membuka menu.');
});

async function makerPhoto(ctx,endpoint,params){const q=new URLSearchParams(params);return ctx.replyWithPhoto(`https://api.azbry.com/api/maker/${endpoint}?${q.toString()}`);}
async function makerSticker(ctx,text){const url=`https://api.azbry.com/api/maker/brat?TEXT=${encodeURIComponent(text)}`;const r=await fetch(url);if(!r.ok)return ctx.reply('Gagal membuat sticker.');const buf=Buffer.from(await r.arrayBuffer());return ctx.replyWithSticker({source:buf});}
function escapeHtml(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
async function forwardToOwner(ctx){if(!config.owner.id)return ctx.reply('Owner belum dikonfigurasi.');await ctx.telegram.sendMessage(config.owner.id,`<b>CHAT ADMIN</b>\nUser ID: <code>${ctx.from.id}</code>\n\n${escapeHtml(ctx.message.text||'[media]')}`,{parse_mode:'HTML'});return ctx.reply('Pesan diteruskan ke admin.');}

bot.catch(err=>console.error('[BOT ERROR]',err));
resolvePremiumEmoji().finally(()=>bot.launch().then(()=>console.log(`Bot running in ${config.mode.toUpperCase()} mode.`)));
process.once('SIGINT',()=>bot.stop('SIGINT'));process.once('SIGTERM',()=>bot.stop('SIGTERM'));
