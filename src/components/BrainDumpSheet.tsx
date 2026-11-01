import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { addNote } from '@/state/notes';
import { useTheme } from '@/theme/useTheme';

import { BottomSheet } from './BottomSheet';
import { PrimaryButton } from './Buttons';
import { useToast } from './IslandToast';
import { Txt } from './Txt';

/**
 * Brain dump: when a thought pops up mid-task ("reply to Sam", "buy batteries"), park it here in
 * a couple of taps instead of switching apps. Capturing it frees working memory without breaking
 * the session — a staple ADHD coping strategy.
 */
export function BrainDumpSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, accent } = useTheme();
  const toast = useToast();
  const [text, setText] = useState('');

  const save = () => {
    if (!text.trim()) return;
    addNote(text);
    setText('');
    onClose();
    toast({
      title: 'Parked for later',
      subtitle: 'Back to what you were doing',
      icon: 'archive-outline',
      haptic: 'success',
    });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Brain dump">
      <Txt variant="footnote" tone="secondary" align="center" style={styles.hint}>
        Get it out of your head. It’ll be waiting when you’re done.
      </Txt>
      <View style={[styles.field, { backgroundColor: colors.card }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="What’s on your mind?"
          placeholderTextColor={colors.textTertiary}
          multiline
          autoFocus
          maxLength={280}
          selectionColor={accent}
          cursorColor={accent}
          style={[styles.input, { color: colors.text }]}
          accessibilityLabel="Brain dump note"
        />
      </View>
      <View style={styles.actions}>
        <PrimaryButton label="Park it" onPress={save} disabled={!text.trim()} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  hint: { marginTop: -8, marginBottom: 14, paddingHorizontal: 24 },
  field: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, minHeight: 110 },
  // `outlineStyle` only matters on web, where browsers draw a focus ring around inputs.
  input: { fontSize: 17, lineHeight: 22, textAlignVertical: 'top', minHeight: 86, outlineStyle: 'none' } as object,
  actions: { marginTop: 12 },
});
