import type { RoomAction, TorpedoView } from './TorpedoGame.js';
export type RoomKind = 'steering' | 'sonar' | 'bunks' | 'galley' | 'engine';
export const ROOMS: readonly {
  title: string; meter: string; view: TorpedoView; kind: RoomKind;
  action: RoomAction; actionLabel: string;
}[];
