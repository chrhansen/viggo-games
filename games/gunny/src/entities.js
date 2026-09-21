import * as THREE from "three";
import { STAR_DEPTH, STAR_BEHIND } from "./flight-effects.js";
import { getGlowTexture } from "./glow-texture.js";
export { createPlayerShip, createEnemyShip } from "./spacecraft.js";
export { createSatellite } from "./satellite.js";

export function createStars(count = 1500, nearby = false) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [
    new THREE.Color(0xd8ecff),
    new THREE.Color(0xfff2ca),
    new THREE.Color(0x9edbff),
  ];

  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    positions[stride] = (Math.random() - 0.5) * (nearby ? 500 : 1400);
    positions[stride + 1] = (Math.random() - 0.5) * (nearby ? 320 : 900);
    positions[stride + 2] = nearby
      ? STAR_BEHIND - Math.random() * (STAR_DEPTH + STAR_BEHIND)
      : -900 - Math.random() * 1300;

    const color = palette[index % palette.length];
    const intensity = 0.7 + Math.random() * 0.35;
    colors[stride] = color.r * intensity;
    colors[stride + 1] = color.g * intensity;
    colors[stride + 2] = color.b * intensity;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const stars = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      map: getGlowTexture(),
      size: nearby ? 1.2 : 2.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  if (nearby) {
    geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -438), 550);
  }
  return stars;
}

export function createProjectile(color, radius) {
  const projectile = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 12, 12),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
    })
  );
  projectile.scale.z = 4;
  return projectile;
}
