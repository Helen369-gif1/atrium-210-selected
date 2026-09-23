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
let yaw=0,pitch=0,dragging=false,px=0,py=0,renderPending=false;
function render(){
  renderPending=false;
  const c=Math.cos(pitch);
  camera.lookAt(c*Math.cos(yaw),Math.sin(pitch),c*Math.sin(yaw));
  renderer.render(scene,camera);
}
function requestRender(){if(!renderPending){renderPending=true;requestAnimationFrame(render)}}
function resize(){
  const w=host.clientWidth,h=host.clientHeight;
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w,h,false);
  requestRender();
}
window.addEventListener('resize',resize);
host.addEventListener('pointerdown',e=>{
  dragging=true;px=e.clientX;py=e.clientY;
  host.setPointerCapture(e.pointerId);
});
host.addEventListener('pointermove',e=>{
  if(!dragging)return;
  yaw=THREE.MathUtils.clamp(yaw-(e.clientX-px)*.0045,-MAX_YAW,MAX_YAW);
  pitch=THREE.MathUtils.clamp(pitch+(e.clientY-py)*.0045,-MAX_PITCH,MAX_PITCH);
  px=e.clientX;py=e.clientY;requestRender();
});
for(const event of ['pointerup','pointercancel'])host.addEventListener(event,()=>dragging=false);
host.addEventListener('wheel',e=>{
  e.preventDefault();
  camera.fov=THREE.MathUtils.clamp(camera.fov+Math.sign(e.deltaY)*3,70,88);
  camera.updateProjectionMatrix();requestRender();
},{passive:false});
document.getElementById('center').addEventListener('click',()=>{
  yaw=0;pitch=0;camera.fov=76;camera.updateProjectionMatrix();requestRender();
});
document.getElementById('fullscreen').addEventListener('click',()=>{
  if(document.fullscreenElement)document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
});
window.addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();
  if(e.key==='ArrowLeft')yaw=Math.min(yaw+.08,MAX_YAW);
  if(e.key==='ArrowRight')yaw=Math.max(yaw-.08,-MAX_YAW);
  if(e.key==='ArrowUp')pitch=Math.min(pitch+.08,MAX_PITCH);
  if(e.key==='ArrowDown')pitch=Math.max(pitch-.08,-MAX_PITCH);
  requestRender();
});
resize();
