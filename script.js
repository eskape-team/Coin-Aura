import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7).normalize();
scene.add(light);

// Physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Materials with friction
const shelfMaterial = new CANNON.Material('shelf');
const coinMaterial = new CANNON.Material('coin');

// Contact material (friction + bounce)
const contact = new CANNON.ContactMaterial(shelfMaterial, coinMaterial, {
    friction: 0.6,   // more friction so coins stick
    restitution: 0.1
});
world.addContactMaterial(contact);

// Cabinet (fixed proportions like your good screenshot)
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, side: THREE.BackSide });
const cabinetGeometry = new THREE.BoxGeometry(8, 6, 10);
const cabinet = new THREE.Mesh(cabinetGeometry, wallMaterial);
cabinet.position.set(0, 2, -2);  
scene.add(cabinet);

// Moving shelf (blue) - extended backwards only
const shelfGeometry = new THREE.BoxGeometry(6, 0.5, 8);  // extended backwards
const shelfMaterialThree = new THREE.MeshPhongMaterial({ color: 0x0000ff });
const shelfMesh = new THREE.Mesh(shelfGeometry, shelfMaterialThree);
shelfMesh.position.set(0, 1, -3.5); // keep front edge aligned like before
scene.add(shelfMesh);

// Physics for shelf
const shelfBody = new CANNON.Body({
    mass: 0, // kinematic
    material: shelfMaterial,
    type: CANNON.Body.KINEMATIC
});
const shelfShape = new CANNON.Box(new CANNON.Vec3(3, 0.25, 4));
shelfBody.addShape(shelfShape);
shelfBody.position.copy(shelfMesh.position);
world.addBody(shelfBody);

// Shelf movement animation
let shelfDirection = 1;
const shelfSpeed = 0.5;  // slowed down
const shelfRange = 1;    

// Coins
const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32);
const coinMaterialThree = new THREE.MeshPhongMaterial({ color: 0xffd700 });
let coins = [];

function createCoin() {
    const coinMesh = new THREE.Mesh(coinGeometry, coinMaterialThree);
    coinMesh.position.set(0, 5, -3); 
    scene.add(coinMesh);

    const coinShape = new CANNON.Cylinder(0.3, 0.3, 0.1, 32);
    const coinBody = new CANNON.Body({
        mass: 1,
        material: coinMaterial
    });
    coinBody.addShape(coinShape);
    coinBody.position.set(0, 5, -3);
    world.addBody(coinBody);

    coins.push({ mesh: coinMesh, body: coinBody });
}

// Drop coin button
document.getElementById('dropCoin').addEventListener('click', createCoin);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Shelf oscillation
    shelfBody.position.z += shelfDirection * shelfSpeed * 0.02;
    if (shelfBody.position.z > -2.5 || shelfBody.position.z < -4.5) {
        shelfDirection *= -1;
    }
    shelfMesh.position.copy(shelfBody.position);

    // Move coins with shelf using velocity transfer
    coins.forEach(({ body }) => {
        const relativeZ = body.position.z - shelfBody.position.z;
        if (body.position.y < 1.5 && Math.abs(relativeZ) < 3.2) {
            body.velocity.z += shelfDirection * shelfSpeed * 0.02; 
        }
    });

    // Physics step
    world.step(1 / 60);

    // Sync meshes
    coins.forEach(({ mesh, body }) => {
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
    });

    renderer.render(scene, camera);
}
animate();
