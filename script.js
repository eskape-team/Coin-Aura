// script.js

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
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

// Cabinet
const material = new THREE.MeshStandardMaterial({ color: 0xcd853f, side: THREE.DoubleSide });
const wallGeometry = new THREE.PlaneGeometry(20, 20);

// Back wall
const backWall = new THREE.Mesh(wallGeometry, material);
backWall.position.z = -10;
scene.add(backWall);

// Left wall
const leftWall = new THREE.Mesh(wallGeometry, material);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.x = -10;
scene.add(leftWall);

// Right wall
const rightWall = new THREE.Mesh(wallGeometry, material);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.x = 10;
scene.add(rightWall);

// Floor
const floor = new THREE.Mesh(wallGeometry, material);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -10;
scene.add(floor);

// Neon Text "Coin Aura"
const fontLoader = new FontLoader();
fontLoader.load('./helvetiker_regular.typeface.json', function (font) {
  const textGeo = new TextGeometry('Coin Aura', {
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
  textMesh.position.set(-7, 5, -9.5); // on the back wall
  scene.add(textMesh);

  // Neon glow light
  const neonLight = new THREE.PointLight(0x00ffff, 2, 50);
  neonLight.position.set(0, 5, -8);
  scene.add(neonLight);
});

// Camera position
camera.position.set(0, 0, 20);

// Animate
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
