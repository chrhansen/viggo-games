import { useAudioPlayer } from 'expo-audio';
import type { Weapon } from 'hunter-guy/scene';

export function useHunterAudio() {
  const rifle = useAudioPlayer(require('hunter-guy/assets/rifle.wav'));
  const bow = useAudioPlayer(require('hunter-guy/assets/bow.wav'));
  const knife = useAudioPlayer(require('hunter-guy/assets/knife.wav'));
  const squirt = useAudioPlayer(require('hunter-guy/assets/squirt.wav'));
  return (weapon: Weapon) => {
    const player = { rifle, bow, knife, squirt }[weapon];
    if (!player.isLoaded) return;
    void player.seekTo(0).then(() => player.play()).catch(() => {});
  };
}
