import * as THREE from 'three';

export function createSubmarineMesh() {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: '#6d1f2e',
    roughness: 0.42,
    metalness: 0.38
  });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: '#241923', roughness: 0.58, metalness: 0.2 });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: '#7ff2ff',
    emissive: '#1c8ca0',
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.1
  });

  const propeller = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.08, 8, 20), darkMaterial);
  propeller.position.x = -2.65;
  propeller.rotation.y = Math.PI / 2;
  group.add(propeller);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 4.6, 22), bodyMaterial);
  body.rotation.z = Math.PI / 2;
  group.add(body);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.06, 22, 14), bodyMaterial);
  nose.scale.x = 0.72;
  nose.position.x = 2.32;
  group.add(nose);

  const tail = new THREE.Mesh(new THREE.SphereGeometry(1.06, 22, 14), bodyMaterial);
  tail.scale.x = 0.55;
  tail.position.x = -2.28;
  group.add(tail);

  const tower = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.95, 0.9), bodyMaterial);
  tower.position.set(0.25, 1.02, 0);
  group.add(tower);

  const finTop = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.9, 4), darkMaterial);
  finTop.position.set(-1.2, 1.35, 0);
  finTop.rotation.y = Math.PI / 4;
  group.add(finTop);

  for (let i = 0; i < 3; i += 1) {
    const porthole = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), glassMaterial);
    porthole.position.set(1.05 - i * 0.85, 0.22, 0.98);
    group.add(porthole);
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
