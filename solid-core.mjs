import Module from './vendor/manifold.js';
let engine;
export async function init(){if(!engine)engine=Module().then(m=>{m.setup();return m;});return engine;}
export function parseSTL(buffer){
 const view=new DataView(buffer),triangles=[];
 const binary=buffer.byteLength>=84&&84+view.getUint32(80,true)*50===buffer.byteLength;
 if(binary){const count=view.getUint32(80,true);if(count>300000)throw Error('الملف كبير جدًا. الحد ٣٠٠ ألف مثلث.');for(let i=0;i<count;i++){const t=[];for(let j=0;j<3;j++){const v=[];for(let k=0;k<3;k++)v.push(view.getFloat32(84+i*50+12+j*12+k*4,true));t.push(v);}triangles.push(t);}}
 else {const text=new TextDecoder().decode(buffer);if(!/^\s*solid\b/i.test(text))throw Error('ملف STL غير صالح.');const matches=text.matchAll(/vertex\s+([+\-\d.eE]+)\s+([+\-\d.eE]+)\s+([+\-\d.eE]+)/g);let t=[];for(const v of matches){t.push([+v[1],+v[2],+v[3]]);if(t.length===3){triangles.push(t);t=[];}if(triangles.length>300000)throw Error('الملف كبير جدًا.');}if(t.length)throw Error('مثلث غير مكتمل في STL.');}
 if(!triangles.length)throw Error('ملف STL فارغ.');
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const t of triangles)for(const v of t)for(let i=0;i<3;i++){if(!Number.isFinite(v[i]))throw Error('إحداثيات غير صالحة في STL.');lo[i]=Math.min(lo[i],v[i]);hi[i]=Math.max(hi[i],v[i]);}
 const size=hi.map((v,i)=>v-lo[i]);if(size.some(v=>v<=0))throw Error('المجسّم يجب أن يكون ثلاثي الأبعاد.');
 const center=[(lo[0]+hi[0])/2,(lo[1]+hi[1])/2,lo[2]];for(const t of triangles)for(const v of t)for(let i=0;i<3;i++)v[i]-=center[i];
 return {triangles,size};
}
function solidFromTriangles(api,triangles){const vertices=[],ids=[],map=new Map();for(const t of triangles)for(const v of t){const key=v.map(x=>Math.round(x*1e6)).join(',');let id=map.get(key);if(id===undefined){id=vertices.length/3;map.set(key,id);vertices.push(...v);}ids.push(id);}const mesh=new api.Mesh({numProp:3,vertProperties:new Float32Array(vertices),triVerts:new Uint32Array(ids)});mesh.merge();try{return api.Manifold.ofMesh(mesh);}catch{throw Error('تعذر قراءة STL كجسم مغلق. أصلح الشبكة في برنامج التقطيع ثم أعد رفعها.');}}
export function trianglesOf(solid){const mesh=solid.getMesh(),t=[];for(let i=0;i<mesh.triVerts.length;i+=3){const tri=[];for(let j=0;j<3;j++){const p=mesh.triVerts[i+j]*mesh.numProp;tri.push(Array.from(mesh.vertProperties.slice(p,p+3)));}t.push(tri);}return t;}
export async function combine(triangles,matrix,options){
 const api=await init(),held=[],keep=s=>{held.push(s);return s;},M=api.Manifold;
 try{
  const {size,depth,x,y,style}=options;if(![size,depth,x,y].every(Number.isFinite)||size<10||size>120||depth<.2||depth>2)throw Error('تحقق من الحجم والعمق والموضع.');
  let model=keep(solidFromTriangles(api,triangles));if(model.status()!=='NoError'||model.isEmpty())throw Error('المجسّم غير مغلق أو يحتوي أخطاء هندسية.');
  const b=model.boundingBox();let z=b.min[2];const cell=size/(matrix.length+8);if(cell<.5)throw Error('الرمز كثيف جدًا لهذا الحجم. قصّر الرابط أو كبّر الرمز.');
  const box=(dims,at)=>keep(keep(M.cube(dims)).translate(at));
  const sourceVolume=model.volume();
  if(options.pad){
   const thickness=Math.max(.8,depth+.4);
   if(b.max[2]-z<thickness)throw Error('����� ������� ��� �� ����� ����� ��������. ���� ����� �����.');
   const fill=box([size,size,thickness],[x-size/2,y-size/2,z]);
   // A solid perimeter prevents the fill from extending outside the model outline.
   const inner=box([size-.4,size-.4,thickness],[x-size/2+.2,y-size/2+.2,z]);
   const rim=keep(fill.subtract(inner)),unsupported=keep(rim.subtract(model));
   if(unsupported.volume()>.0001)throw Error('����� ����� ���� ���� ��� ����� �� ��� ���� ��� �����. ���� ����� �� ���� �����.');
   model=keep(model.add(fill));

  }
  // An exact solid-volume check keeps the complete QR and quiet zone on a flat, solid underside.
  const supportDepth=style==='emboss'?.3:depth+.3;
  const support=box([size,size,supportDepth],[x-size/2,y-size/2,z]);
  const missing=keep(support.subtract(model));if(missing.volume()>Math.max(.0001,size*size*supportDepth*1e-6))throw Error('الرمز لا يقع بالكامل على قاعدة مسطحة وسميكة كفاية. صغّر الحجم أو غيّر الموضع؛ للحفر جرّب عمقًا أقل.');
  const boxes=[];for(let r=0;r<matrix.length;r++)for(let c=0;c<matrix.length;c++)if(matrix[r][c]){
   // +Y points down when viewed from below with screen-up = -Y: QR is not mirrored.
   const gap=Math.min(.015,cell*.025),low=style==='emboss'?z-depth:z-.02,height=depth+.02;
   boxes.push(box([cell-2*gap,cell-2*gap,height],[x-size/2+(c+4)*cell+gap,y-size/2+(r+4)*cell+gap,low]));
  }
  const pattern=keep(M.union(boxes)),result=keep(style==='emboss'?model.add(pattern):model.subtract(pattern));
  if(result.status()!=='NoError'||result.isEmpty())throw Error('لم ينجح دمج المجسّم. جرّب إعدادات أخرى.');
  const parts=result.decompose();const count=parts.length;parts.forEach(p=>p.delete());const originalParts=model.decompose();const originalCount=originalParts.length;originalParts.forEach(p=>p.delete());if(count>originalCount)throw Error('الدمج أنتج قطعًا منفصلة. اختر موضعًا داخل قاعدة المجسّم.');
  const volume=model.volume(),newVolume=result.volume();if(Math.abs(newVolume-volume)<.001)throw Error('لم يتقاطع الرمز مع المجسّم.');
  if(style==='flush'){
   const ink=keep(model.intersect(pattern)),bodyTriangles=trianglesOf(result),qrTriangles=trianglesOf(ink);
   const total=keep(result.add(ink)),parts=total.decompose(),components=parts.length;parts.forEach(p=>p.delete());
   if(Math.abs(total.volume()-model.volume())>Math.max(.001,model.volume()*1e-6))throw Error('لم ينجح فصل جزأي الطباعة.');
   return {triangles:[...bodyTriangles,...qrTriangles],bodyTriangles,qrTriangles,cell,volume,newVolume:total.volume(),sourceVolume,bounds:total.boundingBox(),components,surfaceZ:z};
  }
  return {triangles:trianglesOf(result),cell,volume,newVolume,sourceVolume,bounds:result.boundingBox(),components:count,surfaceZ:z};
 }finally{for(let i=held.length-1;i>=0;i--)held[i].delete();}
}
