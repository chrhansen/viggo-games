import { BackSide, Group, MathUtils, Mesh, MeshBasicMaterial, PlaneGeometry, SphereGeometry } from 'three';

import { createBurbTexture, type BurbTextureFactory } from './textures';

export function createSky(textures: BurbTextureFactory) {
  const group = new Group();
  const skyTexture = createBurbTexture('sky', textures);
  const cloudTexture = createBurbTexture('cloud', textures);
  const dome = new Mesh(
    new SphereGeometry(720, 36, 24),
    new MeshBasicMaterial({
      map: skyTexture,
      side: BackSide,
      fog: false,
    }),
  );
  const cloudMaterial = new MeshBasicMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    fog: false,
  });

  group.add(dome);

  for (let index = 0; index < 20; index += 1) {
    const angle = (index / 20) * Math.PI * 2 + hash(index * 2.7) * 0.2;
    const radius = 250 + hash(index * 4.1) * 150;
    const width = 48 + hash(index * 5.6) * 72;
    const height = width * (0.24 + hash(index * 6.2) * 0.16);
    const cloud = new Mesh(new PlaneGeometry(width, height), cloudMaterial);
    const cloudHeight = 110 + hash(index * 3.9) * 58;

    cloud.position.set(Math.cos(angle) * radius, cloudHeight, Math.sin(angle) * radius);
    cloud.lookAt(0, cloudHeight - 16, 0);
    cloud.rotateZ((hash(index * 7.4) - 0.5) * 0.6);
    group.add(cloud);
  }

  return group;
}

function hash(value: number) { return MathUtils.euclideanModulo(Math.sin(value * 91.31) * 43758.5453123, 1); }
