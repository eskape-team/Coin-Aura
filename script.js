// Import three.js and extras
import * as THREE from './three.module.js';
import { FontLoader } from './FontLoader.js';
import { TextGeometry } from './TextGeometry.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(10, 15, 10);
scene.add(pointLight);

// Cabinet (3 walls + floor + platform)
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xcc8844 });
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xee9966 });

const backWall = new THREE.Mesh(new THREE.BoxGeometry(20, 15, 0.5), wallMaterial);
backWall.position.set(0, 7.5, -10);
scene.add(backWall);

const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 15, 20), wallMaterial);
leftWall.position.set(-10, 7.5, 0);
scene.add(leftWall);

const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 15, 20), wallMaterial);
rightWall.position.set(10, 7.5, 0);
scene.add(rightWall);

const floor = new THREE.Mesh(new THREE.BoxGeometry(20, 0.5, 20), floorMaterial);
floor.position.set(0, 0, 0);
scene.add(floor);

const platform = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 5), floorMaterial);
platform.position.set(0, 0.5, 5);
scene.add(platform);

// Neon text "Coin Aura"
const fontLoader = new FontLoader();
fontLoader.load('./helvetiker_regular.typeface.json', (font) => {
  const textGeo = new TextGeometry("Coin Aura", {
    font: font,
    size: 2,
    height: 0.5,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.05,
    bevelSegments: 5,
  });

  const textMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 2,
  });

  const textMesh = new THREE.Mesh(textGeo, textMaterial);
  textMesh.position.set(-7, 12, -9.5); // near top of back wall
  scene.add(textMesh);

  // Neon glow light
  const neonLight = new THREE.PointLight(0x00ffff, 3, 20);
  neonLight.position.set(0, 12, -8);
  scene.add(neonLight);
});

// Camera position
camera.position.set(0, 10, 25);
camera.lookAt(0, 5, 0);

// Animate
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
