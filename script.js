// script.js — full replacement
// NOTE: needs these files in your repo and referenced exactly the same as before:
// ./three.module.js
// ./cannon-es.js
// (index.html must have <button id="dropBtn">Drop Coin</button>)

import * as THREE from './three.module.js';
import * as CANNON from './cannon-es.js';

// --------------------- basic three scene ---------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071022);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const d = new THREE.DirectionalLight(0xffffff, 0.7);
d.position.set(5, 10, 7.5);
scene.add(d);

// --------------------- physics (cannon-es) ---------------------
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0)
});
world.solver.iterations = 8;
world.allowSleep = true;

// materials
const matWall = new CANNON.Material('wallMat');
const matShelf = new CANNON.Material('shelfMat');
const matCoin = new CANNON.Material('coinMat');

// contact materials (tune friction/restitution here)
world.addContactMaterial(new CANNON.ContactMaterial(matShelf, matCoin, {
  friction: 0.9,        // high friction so coins are carried by shelf
  restitution: 0.05
}));
world.addContactMaterial(new CANNON.ContactMaterial(matCoin, matCoin, {
  friction: 0.4,
  restitution: 0.1
}));
world.addContactMaterial(new CANNON.ContactMaterial(matWall, matCoin, {
  friction: 0.6,
  restitution: 0.05
}));

// --------------------- cabinet (three + cannon static walls) ---------------------
function addWallThreeCannon(pos, size, color = 0x4b4b4b, opacity = 0.9) {
  const [w,h,d] = size;
  // three mesh
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, transparent: true, opacity })
  );
  mesh.position.set(pos.x, pos.y, pos.z);
  scene.add(mesh);
  // cannon body (static)
  const half = new CANNON.Vec3(w/2, h/2, d/2);
  const body = new CANNON.Body({ mass: 0, material: matWall });
  body.addShape(new CANNON.Box(half));
  body.position.set(pos.x, pos.y, pos.z);
  world.addBody(body);
  return { mesh, body };
}

// keep cabinet centered in view
// approximate sizes that work well on mobile view — tune if needed
addWallThreeCannon({ x: 0, y: -6, z: 0 }, [10, 1, 22]);   // floor (bottom)
addWallThreeCannon({ x: 0, y: -1, z: -11 }, [10, 10, 1]); // back wall
addWallThreeCannon({ x: -5.5, y: -1, z: 0 }, [1, 10, 22]); // left wall
addWallThreeCannon({ x: 5.5,  y: -1, z: 0 }, [1, 10, 22]); // right wall

// --------------------- moving shelf (kinematic) ---------------------
// Shelf dimensions (slightly extended depth so coins can't fall behind)
const shelfSize = { w: 8, h: 0.5, d: 18 }; // depth extended
const shelfMesh = new THREE.Mesh(
  new THREE.BoxGeometry(shelfSize.w, shelfSize.h, shelfSize.d),
  new THREE.MeshStandardMaterial({ color: 0x1333ff })
);
// starting position a little above the floor inside the cabinet
shelfMesh.position.set(0, -3.75, -2);
scene.add(shelfMesh);

// Cannon kinematic body
const shelfBody = new CANNON.Body({
  mass: 0,              // zero because it's kinematic
  type: CANNON.Body.KINEMATIC,
  material: matShelf,
});
const shelfHalf = new CANNON.Vec3(shelfSize.w/2, shelfSize.h/2, shelfSize.d/2);
shelfBody.addShape(new CANNON.Box(shelfHalf));
shelfBody.position.set(shelfMesh.position.x, shelfMesh.position.y, shelfMesh.position.z);
world.addBody(shelfBody);

// shelf motion control
let shelfDir = 1;
const shelfSpeed = 1.6; // tune speed (units per second)
const shelfFrontZ = 4;  // forward limit (toward player)
const shelfBackZ = -5;  // back limit (toward cabinet back)

// --------------------- coins list ---------------------
const coins = [];

// helper to create a coin (visual + physics)
function spawnCoin(x = 0, z = 0) {
  const radius = 0.45;
  const thickness = 0.18;

  // three mesh (cylinder laid flat)
  const geometry = new THREE.CylinderGeometry(radius, radius, thickness, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFC400 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2; // visually flat
  mesh.position.set(x, 4.5, z);   // spawn above shelf area
  scene.add(mesh);

  // cannon cylinder shape (needs rotation so flat)
  const cylShape = new CANNON.Cylinder(radius, radius, thickness, 16);
  // cannon's cylinder axis is along X by default; rotate so axis aligns with THREE's Y
  const q = new CANNON.Quaternion();
  q.setFromEuler(Math.PI / 2, 0, 0); // rotate to lay flat
  const body = new CANNON.Body({
    mass: 0.5,
    material: matCoin,
    position: new CANNON.Vec3(x, 4.5, z),
    angularDamping: 0.4,
    linearDamping: 0.01
  });
  body.addShape(cylShape, new CANNON.Vec3(), q);

  // small initial random spin so they tumble a bit
  body.angularVelocity.set(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1);

  // collision event: if hit the shelf, nudge velocity to the shelf so it will move with it
  body.addEventListener('collide', (evt) => {
    const other = evt.body;
    if (other === shelfBody) {
      // copy shelf horizontal velocity onto coin so it moves with the shelf
      body.velocity.x = shelfBody.velocity.x;
      body.velocity.z = shelfBody.velocity.z;
      // small upward nudge to avoid "sticking inside" if collision happened with penetration
      if (body.velocity.y > -0.5) body.velocity.y = Math.max(body.velocity.y, -0.1);
    }
  });

  world.addBody(body);
  coins.push({ mesh, body });
  return { mesh, body };
}

// button hook
const btn = document.getElementById('dropBtn');
if (btn) btn.addEventListener('click', () => {
  // spawn coin at a little random X / Z above shelf center
  const rx = (Math.random() - 0.5) * 2.4;
  const rz = (Math.random() - 0.5) * 2.0;
  spawnCoin(rx, rz);
});

// --------------------- sync + animation ---------------------
let lastTime = null;

function updateShelfPhysics(dt) {
  // calculate new position along z with direction and limits
  const oldZ = shelfBody.position.z;
  let newZ = oldZ + shelfDir * shelfSpeed * dt;

  if (newZ > shelfFrontZ) {
    newZ = shelfFrontZ;
    shelfDir = -1;
  } else if (newZ < shelfBackZ) {
    newZ = shelfBackZ;
    shelfDir = 1;
  }

  // set kinematic body velocity -> important so collisions treat it correctly
  const vZ = (newZ - oldZ) / dt;
  shelfBody.velocity.set(0, 0, vZ);

  // set position (Cannon will use velocity and position for kinematic bodies)
  shelfBody.position.z = newZ;

  // update the three mesh
  shelfMesh.position.copy(shelfBody.position);
  shelfMesh.quaternion.copy(shelfBody.quaternion);
}

function animate(time) {
  requestAnimationFrame(animate);
  if (!lastTime) lastTime = time;
  const dt = Math.min((time - lastTime) / 1000, 1 / 30);
  lastTime = time;

  // update kinematic shelf BEFORE stepping the physics so collisions during step are correct
  updateShelfPhysics(dt);

  // physics step (fixed)
  world.step(1 / 60, dt, 3);

  // sync coin meshes with physics bodies
  for (let i = 0; i < coins.length; i++) {
    const { mesh, body } = coins[i];
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  }

  renderer.render(scene, camera);
}

animate();

// --------------------- small debug helpers (optional) ---------------------
// If you want to move the camera or debug, you can open console and change params:
// shelfSpeed, shelfFrontZ, shelfBackZ etc.
// Example to test: shelfFrontZ = 6; shelfBackZ = -2;
// But keep them reasonable for mobile view.
