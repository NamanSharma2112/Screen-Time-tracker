import { StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/useTheme';

import { BottomSheet } from './BottomSheet';
import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/** iOS action-sheet style confirmation: a message, the action, and a separate Cancel. */
export function ConfirmSheet({ visible, title, message, confirmLabel, destructive, onConfirm, onClose }: Props) {
  const { colors, accent } = useTheme();
  const tint = destructive ? '#FF3B30' : accent;
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={[styles.group, { backgroundColor: colors.card }]}>
        <View style={styles.message}>
          <Txt variant="footnote" weight="600" tone="secondary" align="center">
            {title}
          </Txt>
          <Txt variant="footnote" tone="secondary" align="center">
            {message}
          </Txt>
        </View>
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.separator }} />
        <PressableScale
          haptic="none"
          scaleTo={0.98}
          accessibilityRole="button"
          onPress={() => {
            if (destructive) haptics.warning();
            else haptics.light();
            onConfirm();
          }}
          style={styles.action}
        >
          <Txt variant="body" weight="600" color={tint}>
            {confirmLabel}
          </Txt>
        </PressableScale>
      </View>
      <PressableScale
        scaleTo={0.98}
        accessibilityRole="button"
        onPress={onClose}
        style={[styles.group, styles.action, styles.cancel, { backgroundColor: colors.card }]}
      >
        <Txt variant="body" weight="600">
          Cancel
        </Txt>
      </PressableScale>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: 18, overflow: 'hidden' },
  message: { padding: 16, gap: 4 },
  action: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  cancel: { marginTop: 8 },
});
