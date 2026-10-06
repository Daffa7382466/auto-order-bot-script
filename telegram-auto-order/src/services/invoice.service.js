const {sendRichToChat}=require('../ui/richMessage');
const {rupiah}=require('../utils/format');
const config=require('../config/config');
function invoiceHtml(order){
 const title=order.type==='vps_legal'?'VPS LEGAL':order.type==='noktel'?'NOKTEL':order.type==='script'?'SCRIPT':'VPS';
 const rows=[['Field','Value'],['ID Transaksi',order.id],['Username Buyer',order.username||'-'],['Harga',rupiah(order.total)],['Metode Pembayaran',order.paymentMethod||'-']];
 if(order.type==='vps') rows.push(['Spek VPS',order.spec],['Paket VPS',order.warrantyName||'-'],['Platform VPS',order.provider]);
 if(order.type==='vps_legal') rows.push(['Spek VPS',order.spec],['Platform VPS',order.provider],['Region',order.region],['OS',order.os]);
 if(order.type==='noktel') rows.push(['Nama Noktel',order.noktelName||'-'],['Nomor Noktel',order.noktelNumber||'-']);
 if(order.type==='script') rows.push(['Nama Script',order.scriptName||'-'],['Deskripsi',order.scriptDescription||'-']);
 return `<h1>Invoice ${title}</h1><p>Transaction completed successfully.</p>${require('../ui/richMessage').table(rows)}<hr/><footer>${require('../ui/richMessage').emoji('INVOICE')} Transaction archive</footer>`;
}
async function archiveCompletedOrder(bot,order){if(!config.trxChannelId)return;await sendRichToChat(bot,config.trxChannelId,invoiceHtml(order));}
module.exports={invoiceHtml,archiveCompletedOrder};
