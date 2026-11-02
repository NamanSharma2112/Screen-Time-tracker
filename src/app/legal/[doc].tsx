import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card, Sheet } from '@/components/Surfaces';
import { Txt } from '@/components/Txt';
import { LEGAL } from '@/legal/config';
import { LEGAL_DOCS, type LegalDocId } from '@/legal/content';

export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: LegalDocId }>();
  const content = LEGAL_DOCS[doc] ?? LEGAL_DOCS.privacy;

  return (
    <Screen
      header={{ title: content.title, left: { icon: 'arrow-back', label: 'Back', onPress: () => router.back() } }}
    >
      <View style={styles.intro}>
        <Txt variant="title" align="center">
          {content.title}
        </Txt>
        <Txt variant="footnote" tone="secondary" align="center">
          {LEGAL.appName} · Effective {LEGAL.effectiveDate}
        </Txt>
        <Txt variant="body" tone="secondary" align="center" style={styles.summary}>
          {content.summary}
        </Txt>
      </View>
      <Sheet>
        <View>
          <Card style={styles.card}>
            {content.sections.map((s) => (
              <View key={s.heading} style={styles.section}>
                <Txt variant="headline" accessibilityRole="header">
                  {s.heading}
                </Txt>
                {s.body.map((p, i) => (
                  <Txt key={i} variant="subhead" tone="secondary" style={styles.para}>
                    {p}
                  </Txt>
                ))}
                {s.bullets?.map((b, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Txt variant="subhead" tone="secondary">
                      •
                    </Txt>
                    <Txt variant="subhead" tone="secondary" style={{ flex: 1 }}>
                      {b}
                    </Txt>
                  </View>
                ))}
              </View>
            ))}
          </Card>
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: 32, gap: 4, marginBottom: 24 },
  summary: { marginTop: 10 },
  card: { padding: 20, gap: 20 },
  section: { gap: 6 },
  para: { lineHeight: 21 },
  bulletRow: { flexDirection: 'row', gap: 8, paddingLeft: 4 },
});
