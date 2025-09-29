// script.js
import * as THREE from './three.module.js';

// Scene setup
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 8); // pull back so we see the cabinet

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Cabinet function
function createCabinet() {
  const material = new THREE.MeshBasicMaterial({
    color: 0xff0000, // 🔴 bright red
    wireframe: true, // outlines so we can SEE it
  });

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 5), material);
  leftWall.position.x = -3;
  scene.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 5), material);
  rightWall.position.x = 3;
  scene.add(rightWall);

  // Back wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 1), material);
  backWall.position.z = -2.5;
  scene.add(backWall);

  // Floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 5), material);
  floor.position.y = -2.5;
  scene.add(floor);
}

// Call cabinet
createCabinet();

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
