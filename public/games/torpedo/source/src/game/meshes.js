import * as THREE from 'three';

export function createEnemySubmarineMesh() {
  const group = new THREE.Group();
  const hullMaterial = new THREE.MeshStandardMaterial({
    color: '#1b2930',
    roughness: 0.58,
    metalness: 0.58
  });
  const wetSteelMaterial = new THREE.MeshStandardMaterial({
    color: '#41545b',
    roughness: 0.46,
    metalness: 0.68
  });
  const panelMaterial = new THREE.MeshStandardMaterial({ color: '#121c22', roughness: 0.72, metalness: 0.45 });
  const blackMaterial = new THREE.MeshStandardMaterial({ color: '#070d10', roughness: 0.74, metalness: 0.38 });
  const warningMaterial = new THREE.MeshStandardMaterial({
    color: '#8d1f1c',
    emissive: '#ff2f2a',
    emissiveIntensity: 0.28,
    roughness: 0.42,
    metalness: 0.24
  });

  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.68, 7.2, 14, 28), hullMaterial);
  hull.rotation.z = Math.PI / 2;
  hull.scale.set(1, 0.82, 1);
  group.add(hull);

  const bow = new THREE.Mesh(new THREE.SphereGeometry(0.7, 28, 16), hullMaterial);
  bow.position.x = 4.26;
  bow.scale.set(1.18, 0.72, 0.72);
  group.add(bow);

  const bowCap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.24, 22), panelMaterial);
  bowCap.position.x = 4.88;
  bowCap.rotation.z = Math.PI / 2;
  group.add(bowCap);

  const stern = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.68, 1.1, 24), hullMaterial);
  stern.position.x = -4.2;
  stern.rotation.z = Math.PI / 2;
  group.add(stern);

  const propeller = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 8, 24), wetSteelMaterial);
  propeller.position.x = -4.85;
  propeller.rotation.y = Math.PI / 2;
  group.add(propeller);
  group.userData.propeller = propeller;

  for (const bladeRotation of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.08), wetSteelMaterial);
    blade.position.x = -4.9;
    blade.rotation.x = bladeRotation;
    group.add(blade);
  }

  const keel = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.11, 0.2), blackMaterial);
  keel.position.set(-0.2, -0.58, 0);
  group.add(keel);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.08, 0.42), panelMaterial);
  deck.position.set(-0.25, 0.58, 0);
  group.add(deck);

  const tower = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.98, 0.56), hullMaterial);
  tower.position.set(-0.55, 0.96, 0);
  group.add(tower);

  const towerCap = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.5), wetSteelMaterial);
  towerCap.position.set(-0.55, 1.52, 0);
  group.add(towerCap);

  for (const [x, z, height] of [[-0.92, -0.08, 0.9], [-0.54, 0.08, 0.75], [-0.22, 0, 0.62]]) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, height, 10), blackMaterial);
    mast.position.set(x, 1.94, z);
    group.add(mast);
  }

  const conningLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), warningMaterial);
  conningLight.position.set(0.12, 1.35, 0.32);
  group.add(conningLight);

  const tubeOffsets = [
    [0.17, 0.24],
    [0.17, -0.24],
    [-0.17, 0.24],
    [-0.17, -0.24]
  ];
  for (const [y, z] of tubeOffsets) {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 14), blackMaterial);
    tube.position.set(5.02, y, z);
    tube.rotation.z = Math.PI / 2;
    group.add(tube);
  }

  const planes = [
    { x: 2.25, y: 0, z: 0.68, scale: [0.9, 0.06, 0.3] },
    { x: 2.25, y: 0, z: -0.68, scale: [0.9, 0.06, 0.3] },
    { x: -4.08, y: 0.58, z: 0, scale: [0.74, 0.34, 0.07] },
    { x: -4.08, y: -0.58, z: 0, scale: [0.74, 0.34, 0.07] },
    { x: -4.25, y: 0, z: 0.58, scale: [0.78, 0.07, 0.28] },
    { x: -4.25, y: 0, z: -0.58, scale: [0.78, 0.07, 0.28] }
  ];

  for (const plane of planes) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(...plane.scale), wetSteelMaterial);
    fin.position.set(plane.x, plane.y, plane.z);
    group.add(fin);
  }

  for (const x of [-3.2, -2.1, -1.0, 0.1, 1.2, 2.3, 3.35]) {
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.69, 0.008, 6, 40), blackMaterial);
    seam.position.x = x;
    seam.rotation.y = Math.PI / 2;
    group.add(seam);
  }

  for (const z of [-0.63, 0.63]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.035, 0.05), wetSteelMaterial);
    rail.position.set(-0.2, 0.06, z);
    group.add(rail);
  }

  for (const x of [-2.65, -1.85, -1.05, -0.25, 0.55, 1.35]) {
    const hatch = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.035, 0.46), panelMaterial);
    hatch.position.set(x, 0.64, 0);
    group.add(hatch);
  }

  return group;
}

export function createTorpedoMesh(color, glow) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: glow,
    emissiveIntensity: 0.5,
    roughness: 0.32,
    metalness: 0.35
  });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: '#182026', roughness: 0.5, metalness: 0.55 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.8, 18), material);
  body.rotation.z = Math.PI / 2;
  group.add(body);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 14), material);
  tip.position.x = 1.12;
  tip.rotation.z = -Math.PI / 2;
  group.add(tip);

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.24, 18), darkMaterial);
  tail.position.x = -1.0;
  tail.rotation.z = Math.PI / 2;
  group.add(tail);

  const finPositions = [
    { y: 0.22, z: 0, rotation: 0 },
    { y: -0.22, z: 0, rotation: 0 },
    { y: 0, z: 0.22, rotation: Math.PI / 2 },
    { y: 0, z: -0.22, rotation: Math.PI / 2 }
  ];

  for (const position of finPositions) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.18), darkMaterial);
    fin.position.x = -0.88;
    fin.position.y = position.y;
    fin.position.z = position.z;
    fin.rotation.x = position.rotation;
    group.add(fin);
  }

  const bubbleTrail = new THREE.PointLight(glow, 0.8, 7);
  bubbleTrail.position.x = -1.16;
  group.add(bubbleTrail);
  return group;
}

export function quaternionFacing(direction) {
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction.clone().normalize());
  return quaternion;
}
