import { Platform, StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme/useTheme';

/** Plain grouped-style text input that follows the theme. */
export function TextField({ style, ...rest }: TextInputProps) {
  const { colors, accent } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textTertiary}
      selectionColor={accent}
      cursorColor={accent}
      {...rest}
      style={[
        styles.input,
        { color: colors.text, backgroundColor: colors.card },
        Platform.OS === 'web' && styles.web,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: { fontSize: 16, minHeight: 48, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  web: { outlineStyle: 'none' } as object,
});
