import { DeviceMotion } from 'expo-sensors';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { createBurbMotionInput } from '@/game/burb/motion-input';
import type { BurbTouchInput } from '@/game/burb/touch-input';

type MotionStatus = 'checking' | 'granted' | 'denied' | 'unavailable';

export function useBurbMotion(touch: BurbTouchInput, landscape: boolean, active: boolean) {
  const [input] = useState(() => createBurbMotionInput(touch));
  const [status, setStatus] = useState<MotionStatus>('checking');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!landscape) return;
    let current = true;
    let checking = false;
    async function check() {
      if (checking) return;
      checking = true;
      try {
        if (!await DeviceMotion.isAvailableAsync()) { if (current) setStatus('unavailable'); return; }
        let permission = await DeviceMotion.getPermissionsAsync();
        if (!current) return;
        if (permission.status === 'undetermined') permission = await DeviceMotion.requestPermissionsAsync();
        if (current) setStatus(permission.granted ? 'granted' : 'denied');
      } catch { if (current) setStatus('unavailable'); }
      finally { checking = false; }
    }
    void check();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void check(); });
    return () => { current = false; subscription.remove(); };
  }, [landscape, refresh]);

  const enabled = landscape && status === 'granted';
  useEffect(() => {
    input.setEnabled(false);
    if (!enabled || !active) return;
    let current = true;
    let subscription: ReturnType<typeof DeviceMotion.addListener> | undefined;
    async function subscribe() {
      try {
        const permission = await DeviceMotion.getPermissionsAsync();
        if (!current) return;
        if (!permission.granted) { setStatus('denied'); return; }
        input.setEnabled(true);
        DeviceMotion.setUpdateInterval(33);
        subscription = DeviceMotion.addListener(sample => input.sample(sample, Date.now()));
      } catch { if (current) { input.setEnabled(false); setStatus('unavailable'); } }
    }
    void subscribe();
    return () => { current = false; subscription?.remove(); input.setEnabled(false); };
  }, [active, enabled, input]);

  const enable = useCallback(async () => {
    try {
      const permission = await DeviceMotion.getPermissionsAsync();
      if (!permission.granted && !permission.canAskAgain) await Linking.openSettings();
      else if (!permission.granted) await DeviceMotion.requestPermissionsAsync();
      setRefresh(value => value + 1);
    } catch { setStatus('unavailable'); }
  }, []);
  return { input, enabled, status, enable, recenter: () => input.recenter(Date.now()) };
}
