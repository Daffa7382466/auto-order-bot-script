const fs=require('fs'); const path=require('path');
const { addItem }=require('./inventory.service');
const ROOT=path.resolve(process.cwd(),'script_product'); fs.mkdirSync(ROOT,{recursive:true});
function addScript({name,description,price,tutorial,filePath}){
  const safe=String(name).replace(/[^a-zA-Z0-9._-]+/g,'_').slice(0,80)||'script';
  const dest=path.join(ROOT,`${Date.now()}_${safe}.zip`); fs.copyFileSync(filePath,dest);
  return addItem('script',{name,description,price,tutorial:tutorial||'',filePath:dest,status:'available'});
}
module.exports={addScript,ROOT};
