import * as THREE from 'three';

export const VIEW_CONFIG = {
  front: {
    title: 'Front Window',
    frame: 'front',
    direction: new THREE.Vector3(0, 0, -1),
    fov: 68
  },
  port: {
    title: 'Port Windows',
    frame: 'port',
    direction: new THREE.Vector3(-1, 0, 0),
    fov: 72
  },
  starboard: {
    title: 'Starboard Windows',
    frame: 'starboard',
    direction: new THREE.Vector3(1, 0, 0),
    fov: 72
  },
  periscope: {
    title: 'Periscope',
    frame: 'periscope',
    direction: new THREE.Vector3(0, 0, -1),
    fov: 34
  }
};

export const FRONT_SPAWN_DISTANCE = [78, 112];
export const FRONT_SPAWN_LANES = [-18, -9, 0, 9, 18];
export const PLAYER_BOUNDS = {
  x: 34,
  y: 14
};
export const PLAYER_DODGE_SPEED = 20;
export const PLAYER_MAX_HULL = 160;
