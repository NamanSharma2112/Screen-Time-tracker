import { FlexWidget, OverlapWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import { formatDuration, splitDuration } from '@/lib/time';
import { dark, light, type Palette } from '@/theme/colors';

import { dialSvg } from './dial-svg';

export type WidgetData =
  | { kind: 'ready'; totalMs: number; goalMs: number; pickups: number; accent: string }
  | { kind: 'setup'; accent: string };

type Props = { data: WidgetData; width: number; height: number; scheme: 'light' | 'dark' };

/** Home-screen widget: today's dial and total, styled like the app's cards. Tapping opens the app. */
export function TodayWidget({ data, width, height, scheme }: Props) {
  const colors: Palette = scheme === 'dark' ? dark : light;
  const size = Math.max(80, Math.min(width, height) - 40);
  const bg = (scheme === 'dark' ? '#1C1C1F' : '#FFFFFF') as `#${string}`;

  if (data.kind === 'setup') {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: bg,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <TextWidget
          text="Screen time"
          style={{ fontSize: 15, fontWeight: '600', color: colors.text as `#${string}` }}
        />
        <TextWidget
          text="Tap to allow usage access"
          style={{ fontSize: 12, color: colors.textSecondary as `#${string}`, marginTop: 4, textAlign: 'center' }}
        />
      </FlexWidget>
    );
  }

  const { h, m } = splitDuration(data.totalMs);
  const over = data.totalMs > data.goalMs;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: bg,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
      }}
    >
      <OverlapWidget style={{ width: size, height: size }}>
        <SvgWidget
          svg={dialSvg({ size, progress: data.totalMs / data.goalMs, accent: data.accent, track: colors.track })}
          style={{ width: size, height: size }}
        />
        <FlexWidget style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <TextWidget
            text={h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`}
            style={{ fontSize: Math.round(size * 0.17), fontWeight: '700', color: colors.text as `#${string}` }}
          />
          <TextWidget
            text={over ? `${formatDuration(data.totalMs - data.goalMs)} over` : `of ${formatDuration(data.goalMs)}`}
            style={{
              fontSize: Math.round(size * 0.075),
              color: (over ? data.accent : colors.textSecondary) as `#${string}`,
            }}
          />
        </FlexWidget>
      </OverlapWidget>
      <TextWidget
        text={`Today · ${data.pickups} pickups`}
        style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary as `#${string}`, marginTop: 4 }}
      />
    </FlexWidget>
  );
}
