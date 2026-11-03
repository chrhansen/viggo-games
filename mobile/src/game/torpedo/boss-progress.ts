import { File, Paths } from 'expo-file-system';
import { BOSS_SAVE_KEY, createBossCountStore } from 'torpedo/boss-progress';

export const bossProgress = createBossCountStore({
  read() {
    const file = new File(Paths.document, BOSS_SAVE_KEY);
    return file.exists ? file.textSync() : null;
  },
  write(value) {
    new File(Paths.document, BOSS_SAVE_KEY).write(value);
  },
});
