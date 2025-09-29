// script.js
import * as THREE from './three.module.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

// Cabinet walls
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });

const backWall = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 0.5), wallMaterial);
backWall.position.set(0, 6, -10);
scene.add(backWall);

const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 12, 20), wallMaterial);
leftWall.position.set(-6, 6, 0);
scene.add(leftWall);

const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 12, 20), wallMaterial);
rightWall.position.set(6, 6, 0);
scene.add(rightWall);

// Floor
const floor = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 20), wallMaterial);
floor.position.set(0, 0, 0);
scene.add(floor);

// Moving shelf
const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0xff8040 });
const shelf = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 4), shelfMaterial);
shelf.position.set(0, 2, 2);
scene.add(shelf);

// Neon text loader
const fontLoader = new THREE.FontLoader();
fontLoader.load('./helvetiker_regular.typeface.json', function (font) {
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
  textMesh.position.set(-5, 10, -9.5); // Back wall
  scene.add(textMesh);

  // Glow light for neon
  const neonLight = new THREE.PointLight(0x00ffff, 2, 50);
  neonLight.position.set(0, 10, -8);
  scene.add(neonLight);
});

// Camera position
camera.position.set(0, 8, 20);
camera.lookAt(0, 5, 0);

// Animation
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
