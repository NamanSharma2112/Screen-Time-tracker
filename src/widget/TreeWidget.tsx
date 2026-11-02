import type * as WidgetLib from 'react-native-android-widget';

import { dark, light } from '@/theme/colors';
import type { TreeModel } from '@/tree/model';
import { treeSvg } from '@/tree/svg';

type Props = {
  tree: TreeModel | null;
  accent: string;
  width: number;
  height: number;
  scheme: 'light' | 'dark';
  /** Widget primitives, passed in so the main bundle never hard-depends on the widget package. */
  ui: typeof WidgetLib;
};

/** Home-screen streak tree. Tapping opens the app. */
export function TreeWidget({ tree, accent, width, height, scheme, ui }: Props) {
  const { FlexWidget, SvgWidget, TextWidget } = ui;
  const colors = scheme === 'dark' ? dark : light;
  const bg = (scheme === 'dark' ? '#1C1C1F' : '#FFFFFF') as `#${string}`;
  const size = Math.max(70, Math.min(width, height) - 46);

  if (!tree) {
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
        <TextWidget text="Your tree" style={{ fontSize: 15, fontWeight: '600', color: colors.text as `#${string}` }} />
        <TextWidget
          text="Tap to allow usage access"
          style={{ fontSize: 12, color: colors.textSecondary as `#${string}`, marginTop: 4 }}
        />
      </FlexWidget>
    );
  }

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
        padding: 8,
      }}
    >
      <SvgWidget svg={treeSvg(tree, { accent, dark: scheme === 'dark', size })} style={{ width: size, height: size }} />
      <TextWidget
        text={
          tree.streak > 0
            ? `${tree.stageName} · ${tree.streak}-day streak`
            : `${tree.stageName} · ${tree.growth} leaves`
        }
        style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary as `#${string}`, marginTop: 2 }}
        maxLines={1}
      />
    </FlexWidget>
  );
}
