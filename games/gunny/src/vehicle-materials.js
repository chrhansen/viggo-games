import * as THREE from "three";
import { getSolarPanelMaps, getFoilBumpMap, getHullPanelMap } from "./procedural-textures.js";
import { SUN_DIRECTION } from "./planets.js";

let materials;

function metal(name, color, roughness = 0.45, metalness = 0.5, extra = {}) {
  const material = new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  material.name = name;
  return material;
}

export function vehicleMaterials() {
  if (materials) return materials;
  const { panelMap } = getSolarPanelMaps();
  const panelDetail = getHullPanelMap();
  const canopy = new THREE.MeshPhysicalMaterial({
    color: 0x173c55, metalness: 0.35, roughness: 0.13,
    clearcoat: 1, clearcoatRoughness: 0.06,
  });
  canopy.name = "cockpit-glass";
  materials = {
    hull: metal("ceramic-hull", 0xd5dce0, 0.43, 0.28, { bumpMap: panelDetail, bumpScale: 0.012 }),
    raider: metal("raider-armor", 0x80332c, 0.48, 0.38, { bumpMap: panelDetail, bumpScale: 0.012 }),
    trim: metal("graphite-structure", 0x26303a, 0.46, 0.55),
    steel: metal("brushed-titanium", 0x8a969f, 0.32, 0.78),
    nozzle: metal("engine-interior", 0x111821, 0.65, 0.5),
    markings: metal("ochre-markings", 0xe1a144, 0.55, 0.15),
    redMarkings: metal("raider-markings", 0xcc5540, 0.5, 0.22),
    canopy,
    foil: metal("thermal-blanket", 0xc89a38, 0.43, 0.8, { bumpMap: getFoilBumpMap(), bumpScale: 0.08 }),
    radiator: metal("radiator", 0xe1e3de, 0.72, 0.18),
    dish: metal("antenna-reflector", 0xcbd2d4, 0.42, 0.65, { side: THREE.DoubleSide }),
    panel: metal("solar-cells", 0xffffff, 0.3, 0.5, { map: panelMap, side: THREE.DoubleSide }),
    seam: new THREE.LineBasicMaterial({ color: 0x465564, transparent: true, opacity: 0.6 }),
    redSeam: new THREE.LineBasicMaterial({ color: 0x201e20, transparent: true, opacity: 0.7 }),
    navRed: new THREE.MeshBasicMaterial({ color: 0xff544a }),
    navGreen: new THREE.MeshBasicMaterial({ color: 0x72c9ac }),
    engineBlue: new THREE.MeshBasicMaterial({ color: 0x8bcaff, toneMapped: false }),
    engineAmber: new THREE.MeshBasicMaterial({ color: 0xffae65, toneMapped: false }),
  };
  return materials;
}

export function createSpaceReflections(renderer) {
  const width = 256, height = 128;
  const data = new Float32Array(width * height * 4);
  const earthDirection = new THREE.Vector3(-0.65, -0.5, -0.35).normalize();
  const direction = new THREE.Vector3();
  for (let y = 0; y < height; y++) {
    const latitude = (y + 0.5) / height * Math.PI;
    for (let x = 0; x < width; x++) {
      const longitude = (x + 0.5) / width * Math.PI * 2;
      direction.set(-Math.cos(longitude) * Math.sin(latitude), -Math.cos(latitude), -Math.sin(longitude) * Math.sin(latitude));
      const sunlight = Math.pow(Math.max(0, direction.dot(SUN_DIRECTION)), 96) * 12;
      const earthlight = Math.pow(Math.max(0, direction.dot(earthDirection)), 4) * 0.8;
      const offset = (y * width + x) * 4;
      data.set([0.07 + sunlight + earthlight * 0.18,
        0.085 + sunlight * 0.95 + earthlight * 0.38,
        0.12 + sunlight * 0.85 + earthlight * 0.75, 1], offset);
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromEquirectangular(texture);
  texture.dispose();
  generator.dispose();
  return environment;
}
