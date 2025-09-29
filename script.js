import * as THREE from './three.module.js';
import * as CANNON from './cannon-es.js';

// Scene, camera, renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Camera pulled back and slightly above
camera.position.set(0, 20, 35);
camera.lookAt(0, 7, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 1.2);
spotLight.position.set(20, 50, 30);
spotLight.castShadow = true;
scene.add(spotLight);

// Physics world
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});

// Cabinet walls (brighter brown so visible)
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });

function createWall(w, h, d, x, y, z) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, wallMaterial);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

// Floor
createWall(20, 1, 20, 0, 0, 0);

// Left + right walls
createWall(1, 15, 20, -10, 7.5, 0);
createWall(1, 15, 20, 10, 7.5, 0);

// Back wall
createWall(20, 20, 1, 0, 10, -10);

// Moving shelf (orange)
const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0xff6633 });
const shelfGeo = new THREE.BoxGeometry(14, 1, 6);
const shelf = new THREE.Mesh(shelfGeo, shelfMaterial);
shelf.position.set(0, 1, 5);
scene.add(shelf);

// DEBUG CUBE (red glowing)
const debugGeometry = new THREE.BoxGeometry(2, 2, 2);
const debugMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xaa0000 });
const debugCube = new THREE.Mesh(debugGeometry, debugMaterial);
debugCube.position.set(0, 5, 2);
scene.add(debugCube);

const debugLight = new THREE.PointLight(0xff0000, 2, 50);
debugLight.position.set(0, 10, 10);
scene.add(debugLight);

// Animate
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
