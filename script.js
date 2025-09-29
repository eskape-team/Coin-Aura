import * as THREE from './three.module.js';
import * as CANNON from './cannon-es.js';

// ----- SCENE -----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0d1a);

// ----- CAMERA -----
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 12);
camera.lookAt(0, 2, 0);

// ----- RENDERER -----
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ----- PHYSICS WORLD -----
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const defaultMat = new CANNON.Material('default');
const contactMat = new CANNON.ContactMaterial(defaultMat, defaultMat, {
  friction: 0.3,
  restitution: 0.1
});
world.addContactMaterial(contactMat);

// ----- LIGHTING -----
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(10, 10, 5);
scene.add(dirLight);

// ----- CABINET -----
const wallMat = new THREE.MeshPhongMaterial({ color: 0x444444, side: THREE.DoubleSide });
const wallThickness = 0.2;
const cabinetWidth = 6;
const cabinetDepth = 10;
const cabinetHeight = 6;

// Helper to make wall mesh + physics
function makeWall(width, height, depth, x, y, z) {
  const geo = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geo, wallMat);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  const body = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2)),
    position: new CANNON.Vec3(x, y, z),
    material: defaultMat
  });
  world.addBody(body);
  return { mesh, body };
}

// Back wall
makeWall(cabinetWidth, cabinetHeight, wallThickness, 0, cabinetHeight / 2, -cabinetDepth / 2);
// Left wall
makeWall(wallThickness, cabinetHeight, cabinetDepth, -cabinetWidth / 2, cabinetHeight / 2, 0);
// Right wall
makeWall(wallThickness, cabinetHeight, cabinetDepth, cabinetWidth / 2, cabinetHeight / 2, 0);
// Floor
makeWall(cabinetWidth, wallThickness, cabinetDepth, 0, 0, 0);

// ----- SHELF -----
const shelfColor = new THREE.MeshPhongMaterial({ color: 0x0000ff });
const shelfWidth = 5.5;
const shelfDepth = 3;
const shelfHeight = 0.3;

const shelfGeo = new THREE.BoxGeometry(shelfWidth, shelfHeight, shelfDepth);
const shelf = new THREE.Mesh(shelfGeo, shelfColor);
shelf.position.set(0, 1, -2);
scene.add(shelf);

const shelfBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Box(new CANNON.Vec3(shelfWidth / 2, shelfHeight / 2, shelfDepth / 2)),
  position: new CANNON.Vec3(0, 1, -2),
  material: defaultMat
});
world.addBody(shelfBody);

// Invisible back extension
const backExt = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Box(new CANNON.Vec3(shelfWidth / 2, shelfHeight / 2, 1)),
  position: new CANNON.Vec3(0, 1, -2 - shelfDepth / 2 - 1),
  material: defaultMat
});
world.addBody(backExt);

// Shelf motion
let shelfDir = 1;
const shelfSpeed = 0.5;
const shelfRange = 2;
const shelfStartZ = -2;

// ----- COINS -----
const coins = [];
const coinBodies = [];
const coinRadius = 0.3;
const coinThickness = 0.1;
const coinGeo = new THREE.CylinderGeometry(coinRadius, coinRadius, coinThickness, 32);
const coinMat = new THREE.MeshPhongMaterial({ color: 0xffff00 });

function dropCoin() {
  const coin = new THREE.Mesh(coinGeo, coinMat);
  coin.position.set(0, 5, -2);
  scene.add(coin);

  const coinBody = new CANNON.Body({
    mass: 0.2,
    shape: new CANNON.Cylinder(coinRadius, coinRadius, coinThickness, 16),
    position: new CANNON.Vec3(0, 5, -2),
    material: defaultMat
  });
  coinBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
  world.addBody(coinBody);

  coins.push(coin);
  coinBodies.push(coinBody);
}

// ----- BUTTON -----
const dropBtn = document.createElement('button');
dropBtn.textContent = 'Drop Coin';
dropBtn.style.position = 'absolute';
dropBtn.style.bottom = '20px';
dropBtn.style.left = '50%';
dropBtn.style.transform = 'translateX(-50%)';
dropBtn.style.padding = '10px 20px';
dropBtn.style.fontSize = '18px';
dropBtn.style.background = 'green';
dropBtn.style.color = 'white';
dropBtn.style.border = 'none';
dropBtn.style.borderRadius = '5px';
dropBtn.style.cursor = 'pointer';
document.body.appendChild(dropBtn);
dropBtn.addEventListener('click', dropCoin);

// ----- LOOP -----
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  world.step(1 / 60, delta, 3);

  // Move shelf
  shelfBody.position.z += shelfDir * shelfSpeed * delta;
  if (shelfBody.position.z > shelfStartZ + shelfRange || shelfBody.position.z < shelfStartZ - shelfRange) {
    shelfDir *= -1;
  }
  shelf.position.copy(shelfBody.position);
  shelf.quaternion.copy(shelfBody.quaternion);

  // Move invisible extension
  backExt.position.z = shelfBody.position.z - shelfDepth / 2 - 1;

  // Coins
  coinBodies.forEach((coinBody, i) => {
    const coin = coins[i];
    coin.position.copy(coinBody.position);
    coin.quaternion.copy(coinBody.quaternion);

    // If coin is sitting on shelf, apply motion
    if (Math.abs(coinBody.position.y - shelfBody.position.y) < 0.5) {
      coinBody.velocity.z += shelfDir * shelfSpeed * 0.05;
    }
  });

  renderer.render(scene, camera);
}
animate();

// ----- RESIZE -----
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
