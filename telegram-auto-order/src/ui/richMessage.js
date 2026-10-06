const config=require('../config/config');
function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
function emoji(key){const item=config.emojiResolved?.[key];return item?.id?`<tg-emoji emoji-id="${esc(item.id)}">${esc(item.alternative||'')}</tg-emoji>`:'';}
function h(level,content){return `<h${level}>${content}</h${level}>`;}
function p(content){return `<p>${content}</p>`;} function hr(){return '<hr/>';} function footer(content){return `<footer>${content}</footer>`;}
function table(rows){return `<table bordered striped compact>${rows.map((r,i)=>`<tr>${r.map(c=>i===0?`<th>${c}</th>`:`<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;}
function button(label,data,style='primary',emojiKey=null){return `<tg-button type="callback_data" style="${esc(style)}" data="${esc(data)}">${emoji(emojiKey)}${esc(label)}</tg-button>`;}
function row(...buttons){return `<tg-button-row align="center">${buttons.join('')}</tg-button-row>`;}
function withHeader(html){
  if(!config.headerPhoto) return html;
  const url=esc(config.headerPhoto);
  return `<img src="${url}"/>${html}`;
}
async function sendRich(ctx,html,options={}){return sendRichToChat(ctx.telegram,ctx.chat.id,html,options);}
async function sendRichToChat(telegram,chatId,html,options={}){const content=options.header?withHeader(html):html;return telegram.callApi('sendRichMessage',{chat_id:chatId,rich_message:{html:content}});}
async function editRich(ctx,html,options={}){const content=options.header?withHeader(html):html;return ctx.telegram.callApi('editMessageText',{chat_id:ctx.chat.id,message_id:ctx.callbackQuery.message.message_id,rich_message:{html:content}});}
module.exports={esc,emoji,h,p,hr,footer,table,button,row,withHeader,sendRich,sendRichToChat,editRich};
