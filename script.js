import * as THREE from './three.module.js';
import * as CANNON from './cannon-es.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.NaiveBroadphase();

// Materials
const material = new CANNON.Material();
const contact = new CANNON.ContactMaterial(material, material, {
  friction: 0.2,
  restitution: 0.1,
});
world.addContactMaterial(contact);

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// Helper function to create boxes
function createBox(x, y, z, w, h, d, color, fixed = false) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  const shape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2));
  const body = new CANNON.Body({
    mass: fixed ? 0 : 1,
    position: new CANNON.Vec3(x, y, z),
    material,
  });
  body.addShape(shape);
  world.addBody(body);

  return { mesh, body };
}

// Cabinet
createBox(0, 0, 0, 11, 1, 11, 0x654321, true);  // Floor
createBox(0, 2.5, -5.5, 11, 5, 1, 0x654321, true); // Back wall
createBox(-5.5, 2.5, 0, 1, 5, 11, 0x654321, true); // Left wall
createBox(5.5, 2.5, 0, 1, 5, 11, 0x654321, true);  // Right wall
// ⚠ Front wall is intentionally left open!

// Pusher (moving shelf)
const pusher = createBox(0, 1, 0, 9, 1, 2, 0xff6633, true);

// Coins
const coins = [];
function dropCoin() {
  const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 5, 0);
  scene.add(mesh);

  const shape = new CANNON.Cylinder(0.5, 0.5, 0.2, 32);
  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 5, 0),
    material,
  });
  body.addShape(shape);
  world.addBody(body);

  coins.push({ mesh, body });
}

// Camera
camera.position.set(0, 6, 12);
camera.lookAt(0, 2, 0);

// Button to drop coins
const button = document.createElement('button');
button.innerText = "Drop Coin";
button.style.position = "absolute";
button.style.bottom = "20px";
button.style.left = "50%";
button.style.transform = "translateX(-50%)";
button.style.padding = "10px 20px";
button.style.fontSize = "16px";
document.body.appendChild(button);
button.addEventListener('click', dropCoin);

// Animation
function animate() {
  requestAnimationFrame(animate);

  // Move pusher (keeps back covered, moves forward only)
  const time = Date.now() * 0.001;
  pusher.mesh.position.z = -1 + Math.sin(time) * 1.5;
  pusher.body.position.z = pusher.mesh.position.z;

  // Step physics
  world.step(1 / 60);

  // Sync coins
  coins.forEach(({ mesh, body }) => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  });

  renderer.render(scene, camera);
}
animate();
