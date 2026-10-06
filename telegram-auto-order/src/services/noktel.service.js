const { addItem,listAvailable,getItem,updateItem }=require('./inventory.service');
function addNoktel(data){ return addItem('noktel',data); }
module.exports={addNoktel,listAvailable,getItem,updateItem};
