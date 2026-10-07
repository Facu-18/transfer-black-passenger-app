import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';

/** Decorative motion must not keep running behind another screen or app. */
export function useMotionEnabled() {
  const navigation = useNavigation();
  const [isFocused, setIsFocused] = useState(() => navigation.isFocused());
  const [isActive, setIsActive] = useState(AppState.currentState === 'active');
  const [reduceMotion, setReduceMotion] = useState(true);

  useFocusEffect(useCallback(() => {
    setIsFocused(true);
    return () => setIsFocused(false);
  }, []));

  useEffect(() => {
    let mounted = true;
    let receivedEvent = false;
    const appSubscription = AppState.addEventListener('change', (state) => setIsActive(state === 'active'));
    const motionSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      receivedEvent = true;
      setReduceMotion(enabled);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted && !receivedEvent) setReduceMotion(enabled);
    }).catch(() => {});

    return () => {
      mounted = false;
      appSubscription.remove();
      motionSubscription.remove();
    };
  }, []);

  return isFocused && isActive && !reduceMotion;
}
