import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { PressableScale } from './PressableScale';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  accessibilityLabel: string;
  size?: number;
};

export function CircleButton({ icon, onPress, accessibilityLabel, size = 44 }: Props) {
  const { colors, scheme } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      scaleTo={0.94}
      onPress={onPress}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.circleButton,
          shadowOpacity: scheme === 'dark' ? 0 : 0.06,
        },
      ]}
    >
      <Ionicons name={icon} size={size * 0.46} color={colors.text} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
});
