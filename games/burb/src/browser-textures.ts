import {
  createBarkTexture, createCloudTexture, createGrassTexture, createRoadTexture,
  createShoulderTexture, createSkyTexture, createSpeedSignTexture,
} from './texture-art';
import type { BurbTextureFactory, BurbTextureKind } from './textures';

const generators = {
  road: createRoadTexture, shoulder: createShoulderTexture, grass: createGrassTexture,
  bark: createBarkTexture, sky: createSkyTexture, cloud: createCloudTexture, sign: createSpeedSignTexture,
} satisfies Record<BurbTextureKind, BurbTextureFactory>;

export const createBrowserBurbTexture: BurbTextureFactory = (kind) => generators[kind]();
