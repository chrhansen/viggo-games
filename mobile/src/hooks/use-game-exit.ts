import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, BackHandler } from 'react-native';
import { createGameExitRequest } from '@/navigation/game-exit';

export function useGameExit(title: string, pause: () => () => void) {
  const router = useRouter();
  const [request] = useState(createGameExitRequest);
  const requestExit = useCallback(() => request({
    pause,
    confirm: (cancel, exit) => Alert.alert(
      `Exit ${title}?`,
      'Your current game will end and your progress will reset.',
      [
        { text: 'Keep playing', style: 'cancel', onPress: cancel },
        { text: 'Exit game', style: 'destructive', onPress: exit },
      ],
      { cancelable: false },
    ),
    leave: () => {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    },
  }), [pause, request, router, title]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      requestExit();
      return true;
    });
    return () => subscription.remove();
  }, [requestExit]));
  return requestExit;
}
