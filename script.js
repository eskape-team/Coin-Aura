// script.js
// Full simple coin pusher game using Three.js + cannon-es
// Uses ES module CDNs. Replace in your repo (index.html + style.css as above).

import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.152.2/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';

// ---- Basic scene + renderer + camera ----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071022);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 2000);
camera.position.set(0, 4.0, 10);
camera.lookAt(0,1.2,0);

// Small orbit control for dev (you can remove later)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 18;

// ---- Physics world ----
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0)
});
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;
world.defaultContactMaterial.friction = 0.4;

// contact material for coins vs shelf to let them move with it
const coinMaterial = new CANNON.Material('coinMat');
const shelfMaterial = new CANNON.Material('shelfMat');
const coinShelfContact = new CANNON.ContactMaterial(coinMaterial, shelfMaterial, {
  friction: 0.75, // higher friction so coins move with shelf
  restitution: 0.02
});
world.addContactMaterial(coinShelfContact);

// time step helpers
let lastTime;
function physicsStep(time){
  if(lastTime !== undefined){
    let dt = (time - lastTime) / 1000;
    dt = Math.min(dt, 1/30); // clamp
    world.step(1/60, dt, 3);
  }
  lastTime = time;
}

// ---- lighting ----
const hemi = new THREE.HemisphereLight(0xffffff, 0x222244, 0.8);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(5,10,5);
scene.add(dir);

// ---- helper groups ----
const meshes = [];
const bodies = [];

// ---- create cabinet (static walls) ----
// Sizes tuned for good mobile view
const cabinetWidth = 6.0;
const cabinetDepth = 8.0;
const cabinetHeight = 6.0;
const wallThickness = 0.25;

// Visual walls (semi-transparent grey)
const wallMat = new THREE.MeshStandardMaterial({ color:0x333333, opacity:0.85, transparent:true, metalness:0.1, roughness:0.9 });
function makeWall(w, h, depth=0.1){
  const g = new THREE.BoxGeometry(w, h, depth);
  return new THREE.Mesh(g, wallMat);
}

// floor (visual)
const floorGeo = new THREE.BoxGeometry(cabinetWidth + 2, 0.6, cabinetDepth + 2);
const floorMat = new THREE.MeshStandardMaterial({ color:0x202020, roughness:1 });
const floorMesh = new THREE.Mesh(floorGeo, floorMat);
floorMesh.position.set(0, -0.6, 0);
scene.add(floorMesh);

// left wall
const left = makeWall(cabinetDepth, cabinetHeight, wallThickness);
left.rotation.y = Math.PI/2;
left.position.set(-cabinetWidth/2, cabinetHeight/2 - 0.6, 0);
scene.add(left);

// right wall
const right = makeWall(cabinetDepth, cabinetHeight, wallThickness);
right.rotation.y = Math.PI/2;
right.position.set(cabinetWidth/2, cabinetHeight/2 - 0.6, 0);
scene.add(right);

// rear wall
const back = makeWall(cabinetWidth + 0.2, cabinetHeight, wallThickness);
back.position.set(0, cabinetHeight/2 - 0.6, -cabinetDepth/2 - 0.05);
scene.add(back);

// front bottom lip (so shelf doesn't fall out) - very low
const frontLipGeo = new THREE.BoxGeometry(cabinetWidth, 0.3, wallThickness);
const frontLip = new THREE.Mesh(frontLipGeo, wallMat);
frontLip.position.set(0, -0.45, cabinetDepth/2 - 0.15);
scene.add(frontLip);

// Physics static bodies for walls: create large planes/boxes
const staticMaterial = new CANNON.Material('static');
function addStaticBox(pos, size){
  const shape = new CANNON.Box(new CANNON.Vec3(size.x/2, size.y/2, size.z/2));
  const body = new CANNON.Body({ mass:0, material: staticMaterial });
  body.addShape(shape);
  body.position.copy(pos);
  world.addBody(body);
  bodies.push(body);
  return body;
}

// floor physics
addStaticBox(new CANNON.Vec3(0, -0.9, 0), { x: cabinetWidth + 2, y:0.6, z: cabinetDepth + 2 });
// left wall physics
addStaticBox(new CANNON.Vec3(-cabinetWidth/2 - wallThickness/2, cabinetHeight/2 - 0.6, 0), { x: wallThickness, y: cabinetHeight, z: cabinetDepth });
// right
addStaticBox(new CANNON.Vec3(cabinetWidth/2 + wallThickness/2, cabinetHeight/2 - 0.6, 0), { x: wallThickness, y: cabinetHeight, z: cabinetDepth });
// back
addStaticBox(new CANNON.Vec3(0, cabinetHeight/2 - 0.6, -cabinetDepth/2 - wallThickness/2 + 0.05), { x: cabinetWidth + 0.2, y: cabinetHeight, z: wallThickness });
// front lip physics
addStaticBox(new CANNON.Vec3(0, -0.45, cabinetDepth/2 - 0.15), { x: cabinetWidth, y:0.3, z: wallThickness });

// ---- shelf (kinematic) ----
// Shelf sized to be a little wider than cabinet so no gaps
const shelfWidth = cabinetWidth + 0.8;   // a bit bigger than cabinet to avoid side gaps
const shelfDepth = 3.5;                  // depth of moving shelf
const shelfThickness = 0.25;

const shelfGeo = new THREE.BoxGeometry(shelfWidth, shelfThickness, shelfDepth);
const shelfMat = new THREE.MeshStandardMaterial({ color:0x1646ff, metalness:0.2, roughness:0.5 });
const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
shelfMesh.position.set(0, 0.3, 0.6); // starting z inside cabinet
scene.add(shelfMesh);
meshes.push(shelfMesh);

// Create a kinematic body for the shelf
const shelfBody = new CANNON.Body({
  mass: 0, // we'll set type KINEMATIC
  type: CANNON.Body.KINEMATIC,
  material: shelfMaterial
});
const shelfShape = new CANNON.Box(new CANNON.Vec3(shelfWidth/2, shelfThickness/2, shelfDepth/2));
shelfBody.addShape(shelfShape);
shelfBody.position.set(0, 0.3, 0.6);
world.addBody(shelfBody);
bodies.push(shelfBody);

// Shelf motion parameters
let shelfDir = -1;        // direction: -1 back, +1 forward (towards front)
const shelfSpeed = 1.8;   // units per second (adjust)
const shelfZMin = -1.2;   // far back limit
const shelfZMax = 1.6;    // forward limit (closer to front)
// Note: tunable to taste

// ---- coins (spawn on drop) ----
const coinRadius = 0.35;
const coinHeight = 0.14;

const coinGeo = new THREE.CylinderGeometry(coinRadius, coinRadius, coinHeight, 32);
const coinMat = new THREE.MeshStandardMaterial({ color:0xffd100, metalness:0.6, roughness:0.3 });

const coinMass = 0.25;

const spawnedCoins = [];

// helper to make a coin body + mesh
function spawnCoin(x=0, y=3.5, z=0, spread=0.6){
  const mesh = new THREE.Mesh(coinGeo, coinMat);
  // rotate so coin flat axis is XZ plane (Three cylinder default points along Y so it's fine)
  mesh.castShadow = true;
  scene.add(mesh);

  // Physics cylinder: cannon-es cylinder axis is X by default; rotate shape
  const shape = new CANNON.Cylinder(coinRadius, coinRadius, coinHeight, 20);
  // Align with Three (we want cylinder axis along Y)
  const quat = new CANNON.Quaternion();
  quat.setFromEuler(-Math.PI/2, 0, 0); // rotate shape so axis matches Y
  const coinBody = new CANNON.Body({
    mass: coinMass,
    material: coinMaterial,
    position: new CANNON.Vec3(
      x + (Math.random()-0.5)*spread,
      y + Math.random()*0.2,
      z + (Math.random()-0.5)*spread
    ),
    angularDamping: 0.7,
    linearDamping: 0.05
  });
  coinBody.addShape(shape, new CANNON.Vec3(), quat);
  // give a tiny random spin so they settle naturally
  coinBody.angularVelocity.set((Math.random()-0.5)*6, (Math.random()-0.5)*3, (Math.random()-0.5)*6);
  world.addBody(coinBody);

  spawnedCoins.push({ mesh, body: coinBody });
  return { mesh, body: coinBody };
}

// Drop control button
const dropBtn = document.getElementById('dropBtn');
dropBtn.addEventListener('click', () => {
  // drop a small cluster, positioned just in front of camera / shelf
  const sx = (Math.random()-0.5) * 0.6;
  const sz = shelfBody.position.z - 0.05; // slightly behind shelf front so lands on shelf
  spawnCoin(sx, 3.4, sz, 0.6);
});

// Small function to mass-spawn initial coins for demo (optional)
function fillInitial() {
  for(let i=0;i<5;i++){
    spawnCoin((Math.random()-0.5)*1.4, 3.5 + i*0.06, shelfBody.position.z - 0.05, 0.8);
  }
}
fillInitial();

// ---- animation loop: sync physics -> three ----
function syncBodies(){
  // shelf: kinematic - move back and forth along Z
  const z = shelfBody.position.z + shelfDir * shelfSpeed * fixedDt;
  // if limits reached, invert
  if(z <= shelfZMin){
    shelfBody.position.z = shelfZMin;
    shelfDir = 1;
  } else if(z >= shelfZMax){
    shelfBody.position.z = shelfZMax;
    shelfDir = -1;
  } else {
    shelfBody.position.z = z;
  }
  // set shelf velocity for better collisions (kinematic)
  shelfBody.velocity.set(0, 0, shelfDir * shelfSpeed);

  // update mesh position from physics for shelf
  shelfMesh.position.copy(shelfBody.position);
  shelfMesh.quaternion.copy(shelfBody.quaternion);

  // update coins
  for(const c of spawnedCoins){
    c.mesh.position.copy(c.body.position);
    c.mesh.quaternion.copy(c.body.quaternion);
  }
}

// fixed step length for consistent shelf motion
const fixedDt = 1/60;
let lastRAF = performance.now();

function animate(now){
  requestAnimationFrame(animate);

  // physics step
  const dtSec = (now - lastRAF)/1000;
  // simulate multiple steps if required
  let accumulator = dtSec;
  // limit accumulator to avoid big jumps
  if (accumulator > 0.2) accumulator = 0.2;
  while(accumulator >= fixedDt){
    // move shelf kinematically and set velocity
    // We update shelfBody.position directly in syncBodies() below with fixedDt
    // But we need a "mini-step" approach: call syncBodies with fixedDt
    // Do a local small move:
    const z = shelfBody.position.z + shelfDir * shelfSpeed * fixedDt;
    if (z <= shelfZMin){
      shelfBody.position.z = shelfZMin; shelfDir = 1;
    } else if (z >= shelfZMax){
      shelfBody.position.z = shelfZMax; shelfDir = -1;
    } else {
      shelfBody.position.z = z;
    }
    shelfBody.velocity.set(0,0,shelfDir*shelfSpeed);

    world.step(fixedDt);
    accumulator -= fixedDt;
  }

  // Sync three meshes
  shelfMesh.position.copy(shelfBody.position);
  shelfMesh.quaternion.copy(shelfBody.quaternion);
  for(const c of spawnedCoins){
    c.mesh.position.copy(c.body.position);
    c.mesh.quaternion.copy(c.body.quaternion);
  }

  controls.update();
  renderer.render(scene, camera);
  lastRAF = now;
}
requestAnimationFrame(animate);

// ---- resize handling ----
window.addEventListener('resize', onWindowResize);
function onWindowResize(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ---- simple scoring when coins fall past front lip ----
const scoreEl = document.getElementById('scoreValue');
let score = 0;
function checkScoring(){
  // if coin z > cabinetDepth/2 + 0.3 (past front), remove & score
  const threshold = cabinetDepth/2 + 0.4;
  for(let i = spawnedCoins.length -1; i>=0; i--){
    const c = spawnedCoins[i];
    if(c.body.position.z > threshold){
      // remove
      world.removeBody(c.body);
      scene.remove(c.mesh);
      spawnedCoins.splice(i,1);
      score++;
      scoreEl.textContent = score;
    } else if (c.body.position.y < -4){
      // fallen off bottom, remove to keep memory clean
      world.removeBody(c.body);
      scene.remove(c.mesh);
      spawnedCoins.splice(i,1);
    }
  }
}
setInterval(checkScoring, 400);

// ---- debug: click to spawn too ----
renderer.domElement.addEventListener('dblclick', (e)=>{
  // spawn where shelf is
  spawnCoin((Math.random()-0.5)*1.2, 4.0, shelfBody.position.z - 0.05, 0.8);
});
