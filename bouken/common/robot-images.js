// Fixed imageNo is visual metadata; saved string IDs remain authoritative.
window.BoukenRobotImages=(()=>{
 const feature=id=>BoukenSchema.robotFeatures.find(f=>f.id===id);
 function sprite(file,index,count,width,height,label,cls){
  const node=document.createElement('div');node.className='robot-art '+cls;
  node.setAttribute('role','img');node.setAttribute('aria-label',label);
  Object.assign(node.style,{width:'100%',maxWidth:width+'px',aspectRatio:width+'/'+height,backgroundImage:'url("assets/sheets/'+file+'")',backgroundSize:(count*100)+'% 100%',backgroundPosition:(count===1?0:index/(count-1)*100)+'% 0',backgroundRepeat:'no-repeat',margin:'12px auto',flexShrink:'0'});
  return node;
 }
 function body(){return sprite('robot.png',0,1,256,256,'ぼうけんロボ','robot-body-art');}
 function part(id){const f=feature(id);return f?sprite('robot_parts.png',f.imageNo-1,10,128,128,f.part,'robot-part-art'):null;}
 function help(id){const f=feature(id);if(id&& !f)return null;return sprite('robot_functions.png',f?f.imageNo:0,11,412,618,f?f.label+'のせつめい':'ぼうけんロボをみつけた！','robot-function-art');}
 return Object.freeze({body,part,help});
})();
