// ================== THREE.js Setup ==================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 6, 11); // pulled back so cabinet always visible
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// ================== CANNON.js Setup ==================
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 12;

const coinMat = new CANNON.Material("coinMat");
const shelfMat = new CANNON.Material("shelfMat");

world.addContactMaterial(new CANNON.ContactMaterial(coinMat, shelfMat, {
  friction: 0.4,
  restitution: 0.1
}));
world.addContactMaterial(new CANNON.ContactMaterial(coinMat, coinMat, {
  friction: 0.5,
  restitution: 0.05
}));

// ================== Cabinet ==================
const CABINET_WIDTH = 6;
const CABINET_DEPTH = 8;
const CABINET_HEIGHT = 6;

const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, side: THREE.DoubleSide });

function makeWall(w, h, d, x, y, z) {
  const geom = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geom, wallMaterial);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  const shape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2));
  const body = new CANNON.Body({ mass: 0, material: shelfMat });
  body.addShape(shape);
  body.position.copy(mesh.position);
  world.addBody(body);
}

// Cabinet walls (slightly farther apart so always visible)
makeWall(CABINET_WIDTH, CABINET_HEIGHT, 0.2, 0, CABINET_HEIGHT / 2, -CABINET_DEPTH / 2);   // back
makeWall(CABINET_WIDTH, CABINET_HEIGHT, 0.2, 0, CABINET_HEIGHT / 2, CABINET_DEPTH / 2);    // front lip
makeWall(0.2, CABINET_HEIGHT, CABINET_DEPTH, -CABINET_WIDTH / 2, CABINET_HEIGHT / 2, 0);   // left
makeWall(0.2, CABINET_HEIGHT, CABINET_DEPTH, CABINET_WIDTH / 2, CABINET_HEIGHT / 2, 0);    // right
makeWall(CABINET_WIDTH, 0.2, CABINET_DEPTH, 0, 0, 0);                                      // bottom

// ================== Moving Shelf ==================
const SHELF_Y = 1.2;

const shelfGeom = new THREE.BoxGeometry(4.5, 0.2, 3);
const shelfMatVis = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const shelfMesh = new THREE.Mesh(shelfGeom, shelfMatVis);
shelfMesh.position.set(0, SHELF_Y, 0);
scene.add(shelfMesh);

const shelfShape = new CANNON.Box(new CANNON.Vec3(4.5 / 2, 0.1, 3 / 2));
const shelfBody = new CANNON.Body({ mass: 0, material: shelfMat });
shelfBody.addShape(shelfShape);
shelfBody.position.copy(shelfMesh.position);
world.addBody(shelfBody);

let shelfDirection = 1;
const SHELF_SPEED = 0.006;
const SHELF_RANGE = 1;

// ================== Coins ==================
const coinPool = [];

function dropCoin() {
  const radius = 0.28;
  const thickness = 0.12;

  // THREE coin mesh
  const geom = new THREE.CylinderGeometry(radius, radius, thickness, 32);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set((Math.random() - 0.5) * 1.5, SHELF_Y + 3, shelfMesh.position.z);
  scene.add(mesh);

  // CANNON coin body
  const shape = new CANNON.Cylinder(radius, radius, thickness, 16);
  const body = new CANNON.Body({ mass: 0.55, material: coinMat });
  body.addShape(shape);

  // rotate physics to lie flat
  const q = new CANNON.Quaternion();
  q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
  body.shapeOrientations[0] = q;

  body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
  body.angularDamping = 0.6;
  body.linearDamping = 0.05;

  world.addBody(body);
  coinPool.push({ mesh, body });
}

// ================== Button ==================
document.getElementById("dropButton").addEventListener("click", dropCoin);

// ================== Animation Loop ==================
function animate() {
  requestAnimationFrame(animate);

  // Shelf slide
  shelfBody.position.z += SHELF_SPEED * shelfDirection;
  if (shelfBody.position.z > SHELF_RANGE || shelfBody.position.z < -SHELF_RANGE) {
    shelfDirection *= -1;
  }
  shelfMesh.position.copy(shelfBody.position);

  // Step physics
  world.step(1 / 60);

  // Sync coins
  coinPool.forEach(({ mesh, body }) => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  });

  renderer.render(scene, camera);
}

animate();
