export const BOSS_TARGET = 5;
export const BOSS_SAVE_KEY = 'viggo.torpedo.bosses';

export function resumePrompt(count) {
  return `Your last patrol sank ${count} ${count === 1 ? 'boss' : 'bosses'}. Keep that count or start at zero. Your new patrol starts with a full hull and zero score.`;
}

export function createBossCountStore({ read, write }) {
  return {
    load() {
      try {
        const count = JSON.parse(read() ?? 'null');
        return Number.isInteger(count) && count >= 0 && count <= BOSS_TARGET ? count : null;
      } catch {
        return null;
      }
    },
    save(count) {
      try {
        write(String(count));
      } catch (error) {
        console.warn('Could not save the Torpedo boss count.', error);
      }
    },
  };
}
