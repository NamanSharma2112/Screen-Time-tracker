import { memo, useMemo } from 'react';
import { SvgXml } from 'react-native-svg';

import type { TreeModel } from '@/tree/model';
import { treeSvg } from '@/tree/svg';
import { useTheme } from '@/theme/useTheme';

/** The streak tree, drawn once from the same SVG the home-screen widget uses. Static: no animation. */
export const TreeView = memo(function TreeView({
  model,
  size,
}: {
  model: Pick<TreeModel, 'growth' | 'vitality' | 'today'>;
  size: number;
}) {
  const { accent, scheme } = useTheme();
  const xml = useMemo(
    () => treeSvg(model, { accent, dark: scheme === 'dark', size }),
    [model.growth, model.vitality, model.today, accent, scheme, size], // eslint-disable-line react-hooks/exhaustive-deps
  );
  return <SvgXml xml={xml} width={size} height={size} />;
});
