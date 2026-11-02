import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BrainDumpSheet } from '@/components/BrainDumpSheet';
import { PrimaryButton } from '@/components/Buttons';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { SectionLabel, Sheet } from '@/components/Surfaces';
import { SwipeableRow } from '@/components/SwipeableRow';
import { Txt } from '@/components/Txt';
import { haptics } from '@/lib/haptics';
import { clearDoneNotes, deleteNote, notesStore, toggleNote, type Note } from '@/state/notes';

import { useTheme } from '@/theme/useTheme';

export default function NotesScreen() {
  const notes = notesStore.use();
  const [open, setOpen] = useState(false);
  const pending = notes.filter((n) => !n.done);
  const done = notes.filter((n) => n.done);

  return (
    <>
      <Screen
        header={{
          title: 'Brain dump',
          left: { icon: 'arrow-back', label: 'Back', onPress: () => router.back() },
        }}
        bottom={<PrimaryButton label="Park a thought" onPress={() => setOpen(true)} />}
      >
        <View style={styles.intro}>
          <Txt variant="subhead" tone="secondary" align="center">
            Thoughts you parked while focusing.{'\n'}Tick them off, or swipe left to let them go.
          </Txt>
        </View>
        <Sheet>
          {notes.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="file-tray-outline" size={36} color="#A6A6AE" />
              <Txt variant="headline" align="center">
                Nothing parked
              </Txt>
              <Txt variant="subhead" tone="secondary" align="center">
                When a thought pops up mid-task, drop it here and get straight back to what you were doing.
              </Txt>
            </View>
          ) : null}
          {pending.map((n) => (
            <View key={n.id}>
              <NoteRow note={n} />
            </View>
          ))}
          {done.length ? (
            <View>
              <SectionLabel
                right={
                  <PressableScale
                    hitSlop={10}
                    onPress={() => {
                      haptics.light();
                      clearDoneNotes();
                    }}
                  >
                    <Txt variant="callout" tone="accent" weight="600">
                      Clear
                    </Txt>
                  </PressableScale>
                }
              >
                Done
              </SectionLabel>
            </View>
          ) : null}
          {done.map((n) => (
            <View key={n.id}>
              <NoteRow note={n} />
            </View>
          ))}
        </Sheet>
      </Screen>
      <BrainDumpSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function NoteRow({ note }: { note: Note }) {
  const { colors, accent } = useTheme();

  return (
    <SwipeableRow label={note.text} onDelete={() => deleteNote(note.id)}>
      <View style={[styles.row, { backgroundColor: colors.card }]}>
        <PressableScale
          scaleTo={0.85}
          hitSlop={10}
          haptic="none"
          onPress={() => {
            if (note.done) haptics.selection();
            else haptics.success();
            toggleNote(note.id);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: note.done }}
          accessibilityLabel={note.text}
        >
          <View style={[styles.circle, { borderColor: note.done ? accent : colors.textTertiary }]}>
            {note.done ? (
              <View style={[styles.circleFill, { backgroundColor: accent }]}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            ) : null}
          </View>
        </PressableScale>
        <Txt
          variant="body"
          tone={note.done ? 'tertiary' : 'primary'}
          style={[{ flex: 1 }, note.done && { textDecorationLine: 'line-through' }]}
        >
          {note.text}
        </Txt>
      </View>
    </SwipeableRow>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: 40, marginTop: 4, marginBottom: 24 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  circle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  circleFill: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
