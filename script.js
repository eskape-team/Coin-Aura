// script.js

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Cabinet material
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });

// Left wall
const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 12), wallMaterial);
leftWall.position.set(-6, 5, -1);
scene.add(leftWall);

// Right wall
const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 12), wallMaterial);
rightWall.position.set(6, 5, -1);
scene.add(rightWall);

// Back wall (taller for neon sign)
const backWall = new THREE.Mesh(new THREE.BoxGeometry(12, 14, 1), wallMaterial);
backWall.position.set(0, 7, -7);
scene.add(backWall);

// Floor
const floor = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 12), wallMaterial);
floor.position.set(0, 0, -1);
scene.add(floor);

// Moving shelf
const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0xff7f50 });
const shelf = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 4), shelfMaterial);
shelf.position.set(0, 1, -1);
scene.add(shelf);

// Coins
const coinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32);
const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
let coins = [];

// Drop coin button
document.getElementById("dropCoinBtn").addEventListener("click", () => {
  const coin = new THREE.Mesh(coinGeometry, coinMaterial);
  coin.position.set(0, 12, -1);
  scene.add(coin);
  coins.push(coin);
});

// Neon text "Coin Aura"
let neonLight;
const fontLoader = new THREE.FontLoader();

fontLoader.load(
  "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
  function (font) {
    const textGeo = new THREE.TextGeometry("Coin Aura", {
      font: font,
      size: 1.2,
      height: 0.2,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.03,
      bevelSegments: 5
    });

    const textMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 2
    });

    const textMesh = new THREE.Mesh(textGeo, textMaterial);
    textMesh.position.set(-4, 10, -6.5); // stick to back wall
    scene.add(textMesh);

    // Neon glow light
    neonLight = new THREE.PointLight(0x00ffff, 1.5, 30);
    neonLight.position.set(0, 10, -6);
    scene.add(neonLight);
  }
);

// Camera
camera.position.set(0, 6, 15);

// Animation
let shelfDirection = 1;

function animate() {
  requestAnimationFrame(animate);

  // Animate shelf
  shelf.position.z += 0.03 * shelfDirection;
  if (shelf.position.z > 0 || shelf.position.z < -3) {
    shelfDirection *= -1;
  }

  // Animate coins falling
  coins.forEach((coin) => {
    if (coin.position.y > 1) {
      coin.position.y -= 0.1; // fall down
    }
  });

  renderer.render(scene, camera);
}
animate();

// Resize handling
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
