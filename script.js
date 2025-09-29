// script.js

// ----- Scene Setup -----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1220);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 6, 9);
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// ----- Physics Setup -----
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const defaultMat = new CANNON.Material("default");
const coinMat = new CANNON.Material("coin");

const contactMat = new CANNON.ContactMaterial(defaultMat, coinMat, {
  friction: 0.4,
  restitution: 0.05,
});
world.addContactMaterial(contactMat);
world.defaultContactMaterial = contactMat;

// ----- Cabinet -----
const wallThickness = 0.2;
const wallHeight = 6;
const wallDepth = 6;
const wallWidth = 5;

// Visual cabinet
const wallMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
const floorGeom = new THREE.BoxGeometry(wallWidth, wallThickness, wallDepth);
const floorMesh = new THREE.Mesh(floorGeom, wallMat);
floorMesh.position.set(0, 0, 0);
scene.add(floorMesh);

const backGeom = new THREE.BoxGeometry(wallWidth, wallHeight, wallThickness);
const backMesh = new THREE.Mesh(backGeom, wallMat);
backMesh.position.set(0, wallHeight / 2, -wallDepth / 2);
scene.add(backMesh);

const leftGeom = new THREE.BoxGeometry(wallThickness, wallHeight, wallDepth);
const leftMesh = new THREE.Mesh(leftGeom, wallMat);
leftMesh.position.set(-wallWidth / 2, wallHeight / 2, 0);
scene.add(leftMesh);

const rightGeom = new THREE.BoxGeometry(wallThickness, wallHeight, wallDepth);
const rightMesh = new THREE.Mesh(rightGeom, wallMat);
rightMesh.position.set(wallWidth / 2, wallHeight / 2, 0);
scene.add(rightMesh);

// Physics bodies for walls/floor
const floorBody = new CANNON.Body({ mass: 0, material: defaultMat });
floorBody.addShape(new CANNON.Box(new CANNON.Vec3(wallWidth / 2, wallThickness / 2, wallDepth / 2)));
floorBody.position.copy(floorMesh.position);
world.addBody(floorBody);

const backBody = new CANNON.Body({ mass: 0, material: defaultMat });
backBody.addShape(new CANNON.Box(new CANNON.Vec3(wallWidth / 2, wallHeight / 2, wallThickness / 2)));
backBody.position.copy(backMesh.position);
world.addBody(backBody);

const leftBody = new CANNON.Body({ mass: 0, material: defaultMat });
leftBody.addShape(new CANNON.Box(new CANNON.Vec3(wallThickness / 2, wallHeight / 2, wallDepth / 2)));
leftBody.position.copy(leftMesh.position);
world.addBody(leftBody);

const rightBody = new CANNON.Body({ mass: 0, material: defaultMat });
rightBody.addShape(new CANNON.Box(new CANNON.Vec3(wallThickness / 2, wallHeight / 2, wallDepth / 2)));
rightBody.position.copy(rightMesh.position);
world.addBody(rightBody);

// ----- Moving Shelf -----
const SHELF_Y = 1.2;
const shelfDepth = 2;
const shelfWidth = 3;
const shelfThickness = 0.2;

const shelfGeom = new THREE.BoxGeometry(shelfWidth, shelfThickness, shelfDepth);
const shelfMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const shelfMesh = new THREE.Mesh(shelfGeom, shelfMat);
shelfMesh.position.set(0, SHELF_Y, 0);
scene.add(shelfMesh);

const shelfBody = new CANNON.Body({ mass: 0, material: defaultMat });
const shelfShape = new CANNON.Box(new CANNON.Vec3(shelfWidth / 2, shelfThickness / 2, shelfDepth / 2));
shelfBody.addShape(shelfShape);
shelfBody.position.copy(shelfMesh.position);
world.addBody(shelfBody);

// Shelf animation
let shelfDir = 1;
const shelfRange = 0.5;
const shelfSpeed = 0.002;

// ----- Coins -----
const coinPool = [];

function dropCoin() {
  const radius = 0.28;
  const thickness = 0.12;

  // THREE visual coin (round)
  const geom = new THREE.CylinderGeometry(radius, radius, thickness, 32);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = Math.PI / 2;
  const spawnX = (Math.random() - 0.5) * 1.2;
  const spawnZ = shelfMesh.position.z - 0.2;
  mesh.position.set(spawnX, SHELF_Y + 3, spawnZ);
  scene.add(mesh);

  // CANNON body (thin box for stable stacking)
  const boxShape = new CANNON.Box(new CANNON.Vec3(radius, thickness / 2, radius));
  const body = new CANNON.Body({ mass: 0.55, material: coinMat });
  body.addShape(boxShape);
  body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);

  // Damping + friction for realism
  body.angularDamping = 0.6;
  body.linearDamping = 0.05;
  body.material = coinMat;

  world.addBody(body);
  coinPool.push({ mesh, body });
}

// ----- Animation Loop -----
function animate() {
  requestAnimationFrame(animate);

  // Update shelf oscillation
  const shelfOffset = Math.sin(Date.now() * shelfSpeed) * shelfRange;
  shelfMesh.position.z = shelfOffset;
  shelfBody.position.z = shelfOffset;

  // Step physics
  world.step(1 / 60);

  // Sync meshes to physics bodies
  coinPool.forEach((coin) => {
    coin.mesh.position.copy(coin.body.position);
    coin.mesh.quaternion.copy(coin.body.quaternion);
  });

  renderer.render(scene, camera);
}

animate();

// ----- Drop Button -----
document.getElementById("dropCoinBtn").addEventListener("click", dropCoin);
