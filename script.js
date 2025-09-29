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
const physicsMat = new CANNON.Material();
const contact = new CANNON.ContactMaterial(physicsMat, physicsMat, {
  friction: 0.2,
  restitution: 0.1,
});
world.addContactMaterial(contact);

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// Helper to create boxes
function createBox(w, h, d, x, y, z, color, fixed = false) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  const shape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2));
  const body = new CANNON.Body({
    mass: fixed ? 0 : 1,
    position: new CANNON.Vec3(x, y, z),
    material: physicsMat,
  });
  body.addShape(shape);
  world.addBody(body);

  return { mesh, body };
}

// Cabinet (floor + tall back and sides, front open)
createBox(11, 1, 13, 0, -0.5, 0, 0x654321, true);   // floor (deeper to catch coins)
createBox(11, 12, 1, 0, 6, -6.5, 0x654321, true);   // back wall (tall for neon sign)
createBox(1, 12, 13, -5.5, 6, 0, 0x654321, true);   // left wall
createBox(1, 12, 13, 5.5, 6, 0, 0x654321, true);    // right wall
// front intentionally open!

// Pusher (moving shelf)
const pusher = createBox(9, 1, 2, 0, 1, -2, 0xff6633, true);

// Coins
const coins = [];
function dropCoin() {
  const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 5, -2);
  scene.add(mesh);

  const shape = new CANNON.Cylinder(0.5, 0.5, 0.2, 16);
  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 5, -2),
    material: physicsMat,
  });
  // Rotate cylinder so it's flat like a coin
  body.quaternion.setFromEuler(Math.PI / 2, 0, 0);
  body.addShape(shape);
  world.addBody(body);

  coins.push({ mesh, body });
}

// Camera
camera.position.set(0, 8, 14);
camera.lookAt(0, 2, 0);

// Drop button
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

// Neon sign "Coin Aura"
const loader = new THREE.FontLoader();
loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
  const textGeometry = new THREE.TextGeometry('Coin Aura', {
    font: font,
    size: 1,
    height: 0.2,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 5
  });

  const neonMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.8,
    shininess: 100
  });

  const neonText = new THREE.Mesh(textGeometry, neonMaterial);
  neonText.position.set(-3, 10, -6.4);
  scene.add(neonText);

  // Add point light at same position
  const neonLight = new THREE.PointLight(0x00ffff, 2, 15);
  neonLight.position.set(-3, 10, -6.4);
  scene.add(neonLight);

  // Animate glow
  function animateNeon() {
    requestAnimationFrame(animateNeon);
    const pulse = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
    neonMaterial.emissiveIntensity = pulse;
    neonLight.intensity = pulse * 3;
  }
  animateNeon();
});

// Animation
function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  // Pusher movement (always covers the back edge)
  pusher.mesh.position.z = -1 + Math.sin(time * 0.5) * 1.5;
  pusher.body.position.z = pusher.mesh.position.z;

  // Physics
  world.step(1 / 60);

  // Update coins
  coins.forEach(({ mesh, body }) => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  });

  renderer.render(scene, camera);
}
animate();
