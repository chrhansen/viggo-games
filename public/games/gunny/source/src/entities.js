import * as THREE from "three";
import {
  getEarthMaps,
  getMoonMaps,
  getSolarPanelMaps,
} from "./procedural-textures.js";

const assetCache = {};

function buildMaterials() {
  if (assetCache.materials) {
    return assetCache.materials;
  }

  const { panelMap, panelEmissiveMap } = getSolarPanelMaps();

  assetCache.materials = {
    playerHull: new THREE.MeshPhysicalMaterial({
      color: 0xb18a4d,
      metalness: 0.84,
      roughness: 0.38,
      clearcoat: 0.2,
      clearcoatRoughness: 0.42,
    }),
    playerTrim: new THREE.MeshStandardMaterial({
      color: 0x5a6575,
      metalness: 0.7,
      roughness: 0.42,
    }),
    enemyHull: new THREE.MeshPhysicalMaterial({
      color: 0x784845,
      metalness: 0.68,
      roughness: 0.48,
      clearcoat: 0.08,
    }),
    enemyTrim: new THREE.MeshStandardMaterial({
      color: 0x242831,
      metalness: 0.55,
      roughness: 0.52,
    }),
    canopy: new THREE.MeshPhysicalMaterial({
      color: 0x8ecfff,
      emissive: 0x2b7eb0,
      emissiveIntensity: 0.9,
      metalness: 0.02,
      roughness: 0.04,
      transmission: 0.08,
      transparent: true,
      opacity: 0.92,
    }),
    satelliteBody: new THREE.MeshStandardMaterial({
      color: 0x8d96a4,
      metalness: 0.62,
      roughness: 0.46,
    }),
    satelliteFoil: new THREE.MeshPhysicalMaterial({
      color: 0xc19a52,
      metalness: 0.82,
      roughness: 0.58,
      clearcoat: 0.1,
    }),
    panel: new THREE.MeshStandardMaterial({
      map: panelMap,
      emissiveMap: panelEmissiveMap,
      emissive: new THREE.Color(0x2a7ec8),
      emissiveIntensity: 0.35,
      metalness: 0.4,
      roughness: 0.48,
    }),
    glowCyan: new THREE.MeshBasicMaterial({
      color: 0x99efff,
      transparent: true,
      opacity: 0.9,
    }),
    glowRed: new THREE.MeshBasicMaterial({
      color: 0xff8260,
      transparent: true,
      opacity: 0.9,
    }),
    navBlue: new THREE.MeshBasicMaterial({ color: 0x7fe8ff }),
    navRed: new THREE.MeshBasicMaterial({ color: 0xff655d }),
  };

  return assetCache.materials;
}

function addMesh(
  parent,
  geometry,
  material,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1]
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}

function addNavLight(parent, material, position, scale = 0.12) {
  return addMesh(
    parent,
    new THREE.SphereGeometry(scale, 10, 10),
    material,
    position
  );
}

function buildThrusterCluster(glowMaterial, offsetX = 0.68) {
  const materials = buildMaterials();
  const cluster = new THREE.Group();

  [-offsetX, offsetX].forEach((x) => {
    addMesh(
      cluster,
      new THREE.CylinderGeometry(0.24, 0.34, 1.08, 12),
      materials.playerTrim,
      [x, -0.12, 0],
      [Math.PI / 2, 0, 0]
    );

    addMesh(
      cluster,
      new THREE.CylinderGeometry(0.12, 0.18, 0.42, 12),
      materials.playerTrim,
      [x, -0.12, 0.48],
      [Math.PI / 2, 0, 0]
    );

    addMesh(
      cluster,
      new THREE.SphereGeometry(0.22, 16, 16),
      glowMaterial,
      [x, -0.12, 0.65],
      [0, 0, 0],
      [1.1, 1.1, 1.8]
    );
  });

  return cluster;
}

function buildPlayerShipBody(ship) {
  const materials = buildMaterials();

  addMesh(
    ship,
    new THREE.CylinderGeometry(0.72, 1.06, 6.4, 18),
    materials.playerHull,
    [0, 0, 0.15],
    [Math.PI / 2, 0, 0]
  );
  addMesh(
    ship,
    new THREE.ConeGeometry(0.7, 1.9, 18),
    materials.playerTrim,
    [0, 0.02, -4.08],
    [Math.PI / 2, 0, 0]
  );
  addMesh(
    ship,
    new THREE.BoxGeometry(0.82, 0.34, 3.8),
    materials.playerTrim,
    [0, -0.42, 0.34]
  );
  addMesh(
    ship,
    new THREE.BoxGeometry(0.58, 0.42, 4.4),
    materials.playerTrim,
    [0, 0.7, 0.14]
  );
  addMesh(
    ship,
    new THREE.SphereGeometry(0.74, 24, 24),
    materials.canopy,
    [0, 0.46, -1.35],
    [0, 0, 0],
    [1.05, 0.62, 1.9]
  );

  const wingRootGeometry = new THREE.BoxGeometry(3.9, 0.18, 1.7);
  const wingTipGeometry = new THREE.BoxGeometry(2.15, 0.12, 0.82);

  addMesh(ship, wingRootGeometry, materials.playerHull, [-2.28, -0.06, -0.16], [0, 0, 0.22]);
  addMesh(ship, wingRootGeometry, materials.playerHull, [2.28, -0.06, -0.16], [0, 0, -0.22]);
  addMesh(ship, wingTipGeometry, materials.playerTrim, [-4.72, -0.14, -0.86], [0.12, 0.08, 0.56]);
  addMesh(ship, wingTipGeometry, materials.playerTrim, [4.72, -0.14, -0.86], [0.12, -0.08, -0.56]);

  addMesh(
    ship,
    new THREE.CylinderGeometry(0.28, 0.42, 2.2, 12),
    materials.playerTrim,
    [-1.28, -0.34, 2.18],
    [Math.PI / 2, 0, 0]
  );
  addMesh(
    ship,
    new THREE.CylinderGeometry(0.28, 0.42, 2.2, 12),
    materials.playerTrim,
    [1.28, -0.34, 2.18],
    [Math.PI / 2, 0, 0]
  );

  addMesh(ship, new THREE.BoxGeometry(0.18, 1.26, 1.6), materials.playerHull, [-1, 0.8, 1.86], [0, 0, 0.34]);
  addMesh(ship, new THREE.BoxGeometry(0.18, 1.26, 1.6), materials.playerHull, [1, 0.8, 1.86], [0, 0, -0.34]);
  addMesh(ship, new THREE.BoxGeometry(0.16, 0.16, 1.5), materials.playerTrim, [-0.44, -0.26, -3.36], [Math.PI / 2, 0, 0]);
  addMesh(ship, new THREE.BoxGeometry(0.16, 0.16, 1.5), materials.playerTrim, [0.44, -0.26, -3.36], [Math.PI / 2, 0, 0]);

  addMesh(ship, new THREE.BoxGeometry(0.22, 0.08, 2.45), materials.navBlue, [0, 0.78, -0.82]);
  addNavLight(ship, materials.navBlue, [-4.92, 0.02, -0.96]);
  addNavLight(ship, materials.navRed, [4.92, 0.02, -0.96]);
}

function buildEnemyShipBody(ship) {
  const materials = buildMaterials();

  addMesh(
    ship,
    new THREE.CylinderGeometry(0.56, 0.9, 5.2, 14),
    materials.enemyHull,
    [0, 0, 0.1],
    [Math.PI / 2, 0, 0]
  );
  addMesh(
    ship,
    new THREE.ConeGeometry(0.52, 1.5, 14),
    materials.enemyTrim,
    [0, 0.04, -3.34],
    [Math.PI / 2, 0, 0]
  );
  addMesh(
    ship,
    new THREE.SphereGeometry(0.56, 18, 18),
    materials.canopy,
    [0, 0.28, -0.96],
    [0, 0, 0],
    [1, 0.52, 1.46]
  );

  addMesh(ship, new THREE.BoxGeometry(3.1, 0.16, 1.18), materials.enemyHull, [-1.78, -0.06, 0.16], [0, 0, -0.34]);
  addMesh(ship, new THREE.BoxGeometry(3.1, 0.16, 1.18), materials.enemyHull, [1.78, -0.06, 0.16], [0, 0, 0.34]);
  addMesh(ship, new THREE.BoxGeometry(1.56, 0.18, 1.66), materials.enemyTrim, [-1.04, -0.18, -2.3], [0.14, 0, -0.08]);
  addMesh(ship, new THREE.BoxGeometry(1.56, 0.18, 1.66), materials.enemyTrim, [1.04, -0.18, -2.3], [0.14, 0, 0.08]);
  addMesh(ship, new THREE.BoxGeometry(0.18, 0.18, 1.2), materials.enemyTrim, [-0.44, -0.16, -3.08], [Math.PI / 2, 0, 0]);
  addMesh(ship, new THREE.BoxGeometry(0.18, 0.18, 1.2), materials.enemyTrim, [0.44, -0.16, -3.08], [Math.PI / 2, 0, 0]);
  addMesh(ship, new THREE.BoxGeometry(0.22, 0.82, 1.2), materials.enemyHull, [-0.84, 0.52, 1.54], [0, 0, -0.26]);
  addMesh(ship, new THREE.BoxGeometry(0.22, 0.82, 1.2), materials.enemyHull, [0.84, 0.52, 1.54], [0, 0, 0.26]);
  addMesh(ship, new THREE.BoxGeometry(0.2, 0.08, 1.72), materials.navRed, [0, 0.46, -0.64]);
}

export function createPlayerShip() {
  const ship = new THREE.Group();
  buildPlayerShipBody(ship);

  const engineGlow = buildThrusterCluster(buildMaterials().glowCyan, 0.74);
  engineGlow.position.set(0, 0, 3.24);
  ship.add(engineGlow);
  ship.userData.engineGlow = engineGlow;

  return ship;
}

export function createEnemyShip() {
  const ship = new THREE.Group();
  buildEnemyShipBody(ship);

  const engineGlow = buildThrusterCluster(buildMaterials().glowRed, 0.52);
  engineGlow.position.set(0, -0.04, 2.64);
  ship.add(engineGlow);
  ship.userData.engineGlow = engineGlow;

  ship.scale.setScalar(0.82);
  ship.rotation.y = Math.PI;
  return ship;
}

export function createSatellite() {
  const materials = buildMaterials();
  const satellite = new THREE.Group();

  addMesh(
    satellite,
    new THREE.CylinderGeometry(0.86, 0.86, 2.2, 14),
    materials.satelliteBody,
    [0, 0, 0],
    [0, 0, Math.PI / 2]
  );
  addMesh(satellite, new THREE.BoxGeometry(1.2, 1.28, 1.2), materials.satelliteFoil, [0.14, -0.08, 0]);
  addMesh(
    satellite,
    new THREE.CylinderGeometry(0.09, 0.09, 6.4, 8),
    materials.satelliteBody,
    [0, 0, 0],
    [0, 0, Math.PI / 2]
  );

  addMesh(
    satellite,
    new THREE.BoxGeometry(3.2, 0.08, 1.82),
    materials.panel,
    [-4.58, 0, 0]
  );
  addMesh(
    satellite,
    new THREE.BoxGeometry(3.2, 0.08, 1.82),
    materials.panel,
    [4.58, 0, 0]
  );
  addMesh(satellite, new THREE.BoxGeometry(3.34, 0.12, 1.96), materials.satelliteBody, [-4.58, 0, 0], [0, 0, 0], [1, 1, 1]);
  addMesh(satellite, new THREE.BoxGeometry(3.34, 0.12, 1.96), materials.satelliteBody, [4.58, 0, 0], [0, 0, 0], [1, 1, 1]);

  addMesh(
    satellite,
    new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8),
    materials.satelliteBody,
    [0.18, 1.1, 0],
    [0, 0, 0]
  );
  addMesh(
    satellite,
    new THREE.CylinderGeometry(0.1, 0.68, 0.7, 18, 1, true),
    materials.satelliteBody,
    [0.18, 1.86, 0],
    [Math.PI / 2, 0, 0]
  );
  addMesh(satellite, new THREE.BoxGeometry(0.94, 0.7, 0.7), materials.satelliteFoil, [-0.44, -0.76, 0.42]);
  addMesh(satellite, new THREE.BoxGeometry(0.74, 0.5, 0.5), materials.satelliteBody, [0.78, -0.52, -0.44]);
  addMesh(satellite, new THREE.BoxGeometry(0.08, 1.18, 0.08), materials.satelliteBody, [-0.84, 0.72, -0.62], [0.18, 0.1, 0]);
  addNavLight(satellite, buildMaterials().navRed, [-5.94, 0.14, 0], 0.08);
  addNavLight(satellite, buildMaterials().navBlue, [5.94, -0.14, 0], 0.08);

  return satellite;
}

export function createPlanet(radius, kind) {
  const planet = new THREE.Group();

  if (kind === "earth") {
    const earthMaps = getEarthMaps();
    const body = addMesh(
      planet,
      new THREE.SphereGeometry(radius, 64, 64),
      new THREE.MeshStandardMaterial({
        map: earthMaps.map,
        emissiveMap: earthMaps.emissiveMap,
        emissive: new THREE.Color(0xffcb8c),
        emissiveIntensity: 0.22,
        roughness: 0.96,
        metalness: 0,
      })
    );

    const clouds = addMesh(
      planet,
      new THREE.SphereGeometry(radius * 1.012, 64, 64),
      new THREE.MeshStandardMaterial({
        map: earthMaps.cloudMap,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        roughness: 1,
        metalness: 0,
      })
    );
    clouds.rotation.y = 0.42;

    addMesh(
      planet,
      new THREE.SphereGeometry(radius * 1.08, 48, 48),
      new THREE.MeshBasicMaterial({
        color: 0x70c4ff,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      })
    );

    planet.userData.body = body;
    planet.userData.clouds = clouds;
    return planet;
  }

  const moonMaps = getMoonMaps();
  const body = addMesh(
    planet,
    new THREE.SphereGeometry(radius, 48, 48),
    new THREE.MeshStandardMaterial({
      map: moonMaps.map,
      bumpMap: moonMaps.bumpMap,
      bumpScale: 1.1,
      roughness: 1,
      metalness: 0,
    })
  );
  planet.userData.body = body;
  return planet;
}

export function createStars(count = 2600) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [
    new THREE.Color(0xd8ecff),
    new THREE.Color(0xfff2ca),
    new THREE.Color(0x9edbff),
  ];

  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    positions[stride] = (Math.random() - 0.5) * 1400;
    positions[stride + 1] = (Math.random() - 0.5) * 900;
    positions[stride + 2] = -Math.random() * 2200;

    const color = palette[index % palette.length];
    const intensity = 0.7 + Math.random() * 0.35;
    colors[stride] = color.r * intensity;
    colors[stride + 1] = color.g * intensity;
    colors[stride + 2] = color.b * intensity;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 2.2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      depthWrite: false,
    })
  );
}

export function createProjectile(color, radius) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 12, 12),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
    })
  );
}

export function createExplosion(color) {
  return new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.2, 1),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      wireframe: true,
    })
  );
}
