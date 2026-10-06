import { useAudioPlayer } from 'expo-audio';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, AppState } from 'react-native';

export function useGunnyHullWarning(critical: boolean) {
  const player = useAudioPlayer(require('gunny/assets/hull-warning.wav'));
  const [opacity] = useState(() => new Animated.Value(1));
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (alive) setReducedMotion(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { alive = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    if (!critical || reducedMotion) { opacity.setValue(1); return; }
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.5, duration: 500, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => { pulse.stop(); opacity.setValue(1); };
  }, [critical, opacity, reducedMotion]);
  useEffect(() => {
    if (!critical || !player.isLoaded) { player.pause(); return; }
    let alive = true;
    const beep = () => {
      if (AppState.currentState !== 'active') return;
      void player.seekTo(0).then(() => { if (alive && AppState.currentState === 'active') player.play(); }).catch(() => {});
    };
    beep();
    const timer = setInterval(beep, 1000);
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') player.pause(); });
    return () => { alive = false; clearInterval(timer); subscription.remove(); player.pause(); };
  }, [critical, player, player.isLoaded]);
  return opacity;
}
