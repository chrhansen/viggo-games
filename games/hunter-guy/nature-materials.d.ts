import type { Texture } from 'three';
export type TextureKind = 'ground' | 'bark' | 'fur' | 'needles' | 'leaves' | 'sky';
export function configureNatureTextures(loader: (kind: TextureKind) => Texture): void;
