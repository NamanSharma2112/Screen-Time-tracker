import type * as WidgetLib from 'react-native-android-widget';

import { buddySvg } from '@/buddy/art';
import { buddyMood, cookieLabel } from '@/buddy/cookies';
import { dark, light } from '@/theme/colors';

type Props = {
  cookies: number;
  width: number;
  height: number;
  scheme: 'light' | 'dark';
  /** Widget primitives, passed in so the main bundle never hard-depends on the widget package. */
  ui: typeof WidgetLib;
};

/** Home-screen focus buddy: fed by today's focus sessions. Tapping opens Focus. */
export function BuddyWidget({ cookies, width, height, scheme, ui }: Props) {
  const { FlexWidget, SvgWidget, TextWidget } = ui;
  const colors = scheme === 'dark' ? dark : light;
  const bg = (scheme === 'dark' ? '#1C1C1F' : '#FFFFFF') as `#${string}`;
  const size = Math.max(70, Math.min(width, height) - 40);

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'screentime://focus' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: bg,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
      }}
    >
      <SvgWidget svg={buddySvg(buddyMood(cookies), size)} style={{ width: size, height: size }} />
      <TextWidget
        text={cookies > 0 ? `🍪 ${cookieLabel(cookies)}` : 'Hungry — tap to focus'}
        style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary as `#${string}`, marginTop: 2 }}
        maxLines={1}
      />
    </FlexWidget>
  );
}
