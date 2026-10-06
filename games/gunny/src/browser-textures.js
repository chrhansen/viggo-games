import * as THREE from 'three';

const maps = {
  moon: new URL('../assets/moon.jpg', import.meta.url).href,
  clouds: new URL('../assets/earth-clouds.jpg', import.meta.url).href,
  day: new URL('../assets/earth-day.jpg', import.meta.url).href,
  night: new URL('../assets/earth-night.jpg', import.meta.url).href,
  ocean: new URL('../assets/earth-ocean.jpg', import.meta.url).href,
};

export const loadPlanetTexture = kind => new THREE.TextureLoader().load(maps[kind]);
