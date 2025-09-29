// script.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

let scene, camera, renderer, world;
let shelf, shelfBody;
let coins = [];
let score = 0;

init();
animate();

function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1321);

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 6, 14);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lighting
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  scene.add(light);

  // Physics world
  world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });

  // Cabinet dimensions
  const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x555555, side: THREE.DoubleSide });
  const wallPhysics = new CANNON.Material();
  const thickness = 0.5;
  const innerWidth = 8;
  const innerDepth = 10;
  const innerHeight = 8;

  // Cabinet walls
  addWall(-innerWidth / 2 - thickness / 2, innerHeight / 2 - 2, 0, thickness, innerHeight, innerDepth, wallMaterial, wallPhysics); // left
  addWall(innerWidth / 2 + thickness / 2, innerHeight / 2 - 2, 0, thickness, innerHeight, innerDepth, wallMaterial, wallPhysics);  // right
  addWall(0, innerHeight / 2 - 2, -innerDepth / 2 - thickness / 2, innerWidth, innerHeight, thickness, wallMaterial, wallPhysics); // back
  addWall(0, -thickness / 2, 0, innerWidth, thickness, innerDepth, wallMaterial, wallPhysics); // floor

  // Moving shelf (now matches inside cabinet width, no gaps)
  const shelfGeometry = new THREE.BoxGeometry(innerWidth, 0.5, innerDepth / 2);
  const shelfMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });
  shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
  shelf.position.set(0, 0.25, 0);
  scene.add(shelf);

  const shelfShape = new CANNON.Box(new CANNON.Vec3(innerWidth / 2, 0.25, innerDepth / 4));
  shelfBody = new CANNON.Body({
    mass: 0,
    material: wallPhysics,
    position: new CANNON.Vec3(0, 0.25, 0)
  });
  shelfBody.addShape(shelfShape);
  world.addBody(shelfBody);

  // Drop Coin Button
  const button = document.createElement('button');
  button.innerText = "Drop Coin";
  button.style.position = "absolute";
  button.style.bottom = "20px";
  button.style.left = "50%";
  button.style.transform = "translateX(-50%)";
  button.style.padding = "10px 20px";
  button.style.fontSize = "18px";
  button.style.backgroundColor = "green";
  button.style.color = "white";
  button.style.border = "none";
  button.style.borderRadius = "5px";
  button.style.cursor = "pointer";
  button.onclick = dropCoin;
  document.body.appendChild(button);

  // Scoreboard
  const scoreboard = document.createElement('div');
  scoreboard.id = "scoreboard";
  scoreboard.style.position = "absolute";
  scoreboard.style.top = "10px";
  scoreboard.style.left = "10px";
  scoreboard.style.color = "white";
  scoreboard.style.fontSize = "24px";
  scoreboard.innerText = "Score: 0";
  document.body.appendChild(scoreboard);

  window.addEventListener('resize', onWindowResize);
}

function addWall(x, y, z, w, h, d, material, physicsMaterial) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  const shape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2));
  const body = new CANNON.Body({
    mass: 0,
    material: physicsMaterial,
    position: new CANNON.Vec3(x, y, z)
  });
  body.addShape(shape);
  world.addBody(body);
}

function dropCoin() {
  const radius = 0.5;
  const thickness = 0.2;

  // Visual coin
  const geometry = new THREE.CylinderGeometry(radius, radius, thickness, 32);
  const material = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
  const coinMesh = new THREE.Mesh(geometry, material);
  scene.add(coinMesh);

  // Physics coin
  const coinShape = new CANNON.Cylinder(radius, radius, thickness, 16);
  const coinBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 5, 0),
    shape: coinShape
  });
  world.addBody(coinBody);

  coins.push({ mesh: coinMesh, body: coinBody });
}

function animate() {
  requestAnimationFrame(animate);
  world.step(1 / 60);

  // Shelf movement
  const time = Date.now() * 0.001;
  const amplitude = 1.5;
  const speed = 1;
  const offset = Math.sin(time * speed) * amplitude;
  shelf.position.z = offset;
  shelfBody.position.z = offset;

  // Sync coins
  coins.forEach(({ mesh, body }) => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  });

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
