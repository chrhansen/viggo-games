export const BOSS_TARGET: number;
export const BOSS_SAVE_KEY: string;
export function resumePrompt(count: number): string;
export function createBossCountStore(storage: {
  read(): string | null;
  write(value: string): void;
}): { load(): number | null; save(count: number): void };
