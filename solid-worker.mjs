import {parseSTL,combine} from './solid-core.mjs?v=inside2';
let source;
self.onmessage=async e=>{const {id,type}=e.data;try{if(type==='load'){source=parseSTL(e.data.buffer);postMessage({id,...source});}else if(type==='build'){if(!source)throw Error('ارفع مجسّم STL أولًا.');const result=await combine(source.triangles,e.data.matrix,e.data.options);postMessage({id,...result});}}catch(error){postMessage({id,error:error.message||String(error)});}};
