/* All model coordinates are millimetres. Closed height-field mesh. */
(function(root){
function matrix(text){ const q=qrcode(0,'M');q.addData(text,'Byte');q.make();return Array.from({length:q.getModuleCount()},(_,r)=>Array.from({length:q.getModuleCount()},(_,c)=>q.isDark(r,c))); }
function mesh(m,base=2,relief=.8,background=true){
 if(!background){
  const t=[],s=40/m.length,quad=(a,b,c,d)=>t.push([a,b,c],[a,c,d]);
  m.forEach((row,r)=>row.forEach((dark,x)=>{if(!dark)return;const y=m.length-1-r;
   const x0=x*s+(x===0?0:.015),x1=(x+1)*s-(x===m.length-1?0:.015),y0=y*s+(y===0?0:.015),y1=(y+1)*s-(y===m.length-1?0:.015);
   const a=[x0,y0,0],b=[x1,y0,0],c=[x1,y1,0],d=[x0,y1,0],A=[x0,y0,relief],B=[x1,y0,relief],C=[x1,y1,relief],D=[x0,y1,relief];
   quad(d,c,b,a);quad(A,B,C,D);quad(a,b,B,A);quad(b,c,C,B);quad(c,d,D,C);quad(d,a,A,D);
  }));return t;
 }
 const n=m.length+8,s=40/n,t=[],gap=.015;
 const quad=(a,b,c,d)=>{t.push([a,b,c],[a,c,d]);};
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const x0=x*s,x1=(x+1)*s,y0=y*s,y1=(y+1)*s;
  const a=[x0,y0,base],b=[x1,y0,base],c=[x1,y1,base],d=[x0,y1,base];
  const dark=y>=4&&y<n-4&&x>=4&&x<n-4&&m[m.length-1-(y-4)][x-4];
  quad([x0,y1,0],[x1,y1,0],[x1,y0,0],[x0,y0,0]);
  if(dark){
   const p=[x0+gap,y0+gap,base],q=[x1-gap,y0+gap,base],r=[x1-gap,y1-gap,base],u=[x0+gap,y1-gap,base];
   quad(a,b,q,p);quad(b,c,r,q);quad(c,d,u,r);quad(d,a,p,u);
   const P=[p[0],p[1],base+relief],Q=[q[0],q[1],base+relief],R=[r[0],r[1],base+relief],U=[u[0],u[1],base+relief];
   quad(p,q,Q,P);quad(q,r,R,Q);quad(r,u,U,R);quad(u,p,P,U);quad(P,Q,R,U);
  }else quad(a,b,c,d);
  if(y===0)quad([x0,y0,0],[x1,y0,0],b,a);
  if(x===n-1)quad([x1,y0,0],[x1,y1,0],c,b);
  if(y===n-1)quad([x1,y1,0],[x0,y1,0],d,c);
  if(x===0)quad([x0,y1,0],[x0,y0,0],a,d);
 }
 return t;
}
function stl(tris){const out=new ArrayBuffer(84+tris.length*50),v=new DataView(out);v.setUint32(80,tris.length,true);let o=84;for(const [a,b,c] of tris){const u=b.map((e,i)=>e-a[i]),w=c.map((e,i)=>e-a[i]),n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]],len=Math.hypot(...n);for(const e of [...n.map(e=>e/len),...a,...b,...c]){v.setFloat32(o,e,true);o+=4;}o+=2;}return out;}
root.QRPlate={matrix,mesh,stl};
})(typeof module!=='undefined'?module.exports:window);

