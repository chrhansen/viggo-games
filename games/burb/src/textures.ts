import { RepeatWrapping, SRGBColorSpace, type Texture } from 'three';

export const burbTextureKinds = ['road', 'shoulder', 'grass', 'bark', 'sky', 'cloud', 'sign'] as const;
export type BurbTextureKind = typeof burbTextureKinds[number];
export type BurbTextureFactory = (kind: BurbTextureKind) => Texture;

export function createBurbTexture(kind: BurbTextureKind, factory: BurbTextureFactory) {
  const texture = factory(kind);
  texture.colorSpace = SRGBColorSpace;
  if (['road', 'shoulder', 'grass', 'bark'].includes(kind)) {
    texture.wrapS = texture.wrapT = RepeatWrapping;
  }
  if (kind === 'bark') texture.repeat.set(2, 2);
  return texture;
}
