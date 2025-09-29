import * as THREE from './three.module.js';
import * as CANNON from './cannon-es.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 35);
camera.lookAt(0, 10, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const spotLight = new THREE.SpotLight(0xffffff, 1.2);
spotLight.position.set(20, 50, 30);
spotLight.castShadow = true;
scene.add(spotLight);

// Cabinet material
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });

// Helper to create walls
function createWall(w, h, d, x, y, z) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, wallMaterial);
  mesh.position.set(x, y, z);
  scene.add(mesh);
}

// Cabinet pieces
createWall(20, 1, 20, 0, 0, 0);         // Floor
createWall(1, 20, 20, -10, 10, 0);      // Left wall
createWall(1, 20, 20, 10, 10, 0);       // Right wall
createWall(20, 20, 1, 0, 10, -10);      // Back wall

// Shelf
const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0xff6633 });
const shelf = new THREE.Mesh(new THREE.BoxGeometry(14, 1, 6), shelfMaterial);
shelf.position.set(0, 1, 5);
scene.add(shelf);

// Neon text "Coin Aura"
let neonLight;
const fontLoader = new THREE.FontLoader();
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function (font) {
  const textGeo = new THREE.TextGeometry("Coin Aura", {
    font: font,
    size: 2,
    height: 0.5,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.05,
    bevelSegments: 5
  });

  const textMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 2
  });

  const textMesh = new THREE.Mesh(textGeo, textMaterial);
  textMesh.position.set(-7, 15, -9.5); // Place on back wall
  scene.add(textMesh);

  // Neon glow light
  neonLight = new THREE.PointLight(0x00ffff, 2, 40);
  neonLight.position.set(0, 15, -8);
  scene.add(neonLight);
});

// Animation loop
let t = 0;
function animate() {
  requestAnimationFrame(animate);

  // Pulse neon glow
  if (neonLight) {
    t += 0.05;
    neonLight.intensity = 1.5 + Math.sin(t) * 0.5;
  }

  renderer.render(scene, camera);
}
animate();

// Resize support
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
