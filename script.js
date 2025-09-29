// ================== Cabinet ==================
const CABINET_WIDTH = 6;
const CABINET_DEPTH = 8;
const CABINET_HEIGHT = 6;

const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });

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

// back wall
makeWall(CABINET_WIDTH, CABINET_HEIGHT, 0.2, 0, CABINET_HEIGHT / 2, -CABINET_DEPTH / 2);
// left wall
makeWall(0.2, CABINET_HEIGHT, CABINET_DEPTH, -CABINET_WIDTH / 2, CABINET_HEIGHT / 2, 0);
// right wall
makeWall(0.2, CABINET_HEIGHT, CABINET_DEPTH, CABINET_WIDTH / 2, CABINET_HEIGHT / 2, 0);
// bottom floor
makeWall(CABINET_WIDTH, 0.2, CABINET_DEPTH, 0, 0, 0);
