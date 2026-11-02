import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/useTheme';

import { BottomSheet } from './BottomSheet';
import { Divider } from './Surfaces';
import { Txt } from './Txt';

export type Option<T> = { value: T; label: string; detail?: string };

type Props<T> = {
  visible: boolean;
  title: string;
  options: Option<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

/** A single-choice picker presented as a bottom sheet, like an iOS settings detail list. */
export function OptionSheet<T extends string | number | boolean>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: Props<T>) {
  const { colors, accent } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={[styles.group, { backgroundColor: colors.card }]}>
        {options.map((opt, i) => {
          const selected = opt.value === value;
          return (
            <View key={String(opt.value)}>
              {i > 0 ? <Divider inset={16} /> : null}
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  haptics.selection();
                  onSelect(opt.value);
                  // Let the checkmark land before the sheet leaves.
                  setTimeout(onClose, 140);
                }}
                style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.separator }]}
              >
                <View style={{ flex: 1 }}>
                  <Txt variant="body" weight={selected ? '600' : '400'}>
                    {opt.label}
                  </Txt>
                  {opt.detail ? (
                    <Txt variant="footnote" tone="secondary">
                      {opt.detail}
                    </Txt>
                  ) : null}
                </View>
                {selected ? (
                  <View>
                    <Ionicons name="checkmark" size={20} color={accent} />
                  </View>
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: 18, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 54, paddingHorizontal: 16, paddingVertical: 10 },
});
