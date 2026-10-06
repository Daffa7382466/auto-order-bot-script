const { collection, save } = require('./store.service');
function addItem(type, data) { const a=collection('inventory'); const item={id:`${type.toUpperCase()}-${Date.now()}-${Math.floor(Math.random()*1000)}`,type,status:'available',createdAt:new Date().toISOString(),...data}; a.push(item);save('inventory',a);return item; }
function listAvailable(type){ return collection('inventory').filter(x=>x.type===type && x.status==='available'); }
function getItem(id){ return collection('inventory').find(x=>x.id===id)||null; }
function updateItem(id,patch){ const a=collection('inventory');const i=a.findIndex(x=>x.id===id);if(i<0)return null;a[i]={...a[i],...patch,updatedAt:new Date().toISOString()};save('inventory',a);return a[i]; }
module.exports={addItem,listAvailable,getItem,updateItem};
