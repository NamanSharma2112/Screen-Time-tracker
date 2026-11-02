import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';

/**
 * Lets a screen paint something light (a skeleton) first and build its heavy content a moment
 * later, so opening it never stutters.
 *
 * - `afterTransition`: wait for the stack push animation to finish (with a short fallback), so the
 *   slide-in runs without competing with a big render.
 * - otherwise: wait just one frame (tab switches have no transition).
 */
export function useDeferredRender(afterTransition = false): boolean {
  const navigation = useNavigation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    if (!afterTransition) {
      const frame = requestAnimationFrame(() => setTimeout(finish, 0));
      return () => cancelAnimationFrame(frame);
    }
    // `transitionEnd` is emitted by native-stack screens; the timer covers platforms that don't.
    const unsubscribe = (navigation as unknown as { addListener: (e: string, cb: () => void) => () => void }).addListener(
      'transitionEnd',
      finish,
    );
    const timer = setTimeout(finish, 450);
    return () => {
      unsubscribe?.();
      clearTimeout(timer);
    };
  }, [afterTransition, navigation]);

  return ready;
}
