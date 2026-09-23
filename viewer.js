import * as THREE from './vendor/three.module.js';

const host=document.getElementById('viewer');
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(76,1,.1,1100);
camera.position.set(0,0,0);
let renderer;
try {
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
} catch (e) { document.getElementById('error').style.display='block'; throw e; }

const texture=new THREE.TextureLoader().load('./assets/atrium-panorama.png',()=>render(),undefined,()=>{
  document.getElementById('error').style.display='block';
});
texture.colorSpace=THREE.SRGBColorSpace;
texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
const sphere=new THREE.Mesh(
  new THREE.SphereGeometry(500,96,64),
  new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide})
);
scene.add(sphere);

const MAX_YAW=THREE.MathUtils.degToRad(105);
const MAX_PITCH=THREE.MathUtils.degToRad(12);
const SENS=.0045,DAMPING=.09,FRICTION=.9;
let yaw=0,pitch=0,targetYaw=0,targetPitch=0,velYaw=0,velPitch=0;
let dragging=false,px=0,py=0,animating=false;
function render(){
  const c=Math.cos(pitch);
  camera.lookAt(c*Math.cos(yaw),Math.sin(pitch),c*Math.sin(yaw));
  renderer.render(scene,camera);
}
function tick(){
  if(!dragging){
    targetYaw=THREE.MathUtils.clamp(targetYaw+velYaw,-MAX_YAW,MAX_YAW);
    targetPitch=THREE.MathUtils.clamp(targetPitch+velPitch,-MAX_PITCH,MAX_PITCH);
    velYaw*=FRICTION;velPitch*=FRICTION;
    if(Math.abs(velYaw)<.00003)velYaw=0;
    if(Math.abs(velPitch)<.00003)velPitch=0;
  }
  yaw+=(targetYaw-yaw)*DAMPING;
  pitch+=(targetPitch-pitch)*DAMPING;
  render();
  const settled=!dragging&&velYaw===0&&velPitch===0&&Math.abs(targetYaw-yaw)<.00003&&Math.abs(targetPitch-pitch)<.00003;
  if(settled){animating=false;return}
  requestAnimationFrame(tick);
}
function requestRender(){if(!animating){animating=true;requestAnimationFrame(tick)}}
function resize(){
  const w=host.clientWidth,h=host.clientHeight;
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w,h,false);
  requestRender();
}
window.addEventListener('resize',resize);
host.addEventListener('pointerdown',e=>{
  dragging=true;px=e.clientX;py=e.clientY;velYaw=0;velPitch=0;
  host.setPointerCapture(e.pointerId);
  requestRender();
});
host.addEventListener('pointermove',e=>{
  if(!dragging)return;
  const dYaw=-(e.clientX-px)*SENS,dPitch=(e.clientY-py)*SENS;
  targetYaw=THREE.MathUtils.clamp(targetYaw+dYaw,-MAX_YAW,MAX_YAW);
  targetPitch=THREE.MathUtils.clamp(targetPitch+dPitch,-MAX_PITCH,MAX_PITCH);
  velYaw=dYaw;velPitch=dPitch;
  px=e.clientX;py=e.clientY;requestRender();
});
for(const event of ['pointerup','pointercancel'])host.addEventListener(event,()=>{dragging=false;requestRender();});
host.addEventListener('wheel',e=>{
  e.preventDefault();
  camera.fov=THREE.MathUtils.clamp(camera.fov+Math.sign(e.deltaY)*3,70,88);
  camera.updateProjectionMatrix();requestRender();
},{passive:false});
document.getElementById('center').addEventListener('click',()=>{
  targetYaw=0;targetPitch=0;velYaw=0;velPitch=0;
  camera.fov=76;camera.updateProjectionMatrix();requestRender();
});
document.getElementById('fullscreen').addEventListener('click',()=>{
  if(document.fullscreenElement)document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
});
window.addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();
  if(e.key==='ArrowLeft')targetYaw=Math.min(targetYaw+.08,MAX_YAW);
  if(e.key==='ArrowRight')targetYaw=Math.max(targetYaw-.08,-MAX_YAW);
  if(e.key==='ArrowUp')targetPitch=Math.min(targetPitch+.08,MAX_PITCH);
  if(e.key==='ArrowDown')targetPitch=Math.max(targetPitch-.08,-MAX_PITCH);
  requestRender();
});
resize();
