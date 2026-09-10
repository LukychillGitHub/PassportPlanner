import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';

type Slide = {
  icon: string;
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    icon: '📘',
    title: 'Bienvenido a PassportPlanner',
    description: 'Un pasaporte de actividades para compartir con esa persona especial.',
  },
  {
    icon: '🖋️',
    title: 'Sellá cada experiencia',
    description: 'Agregá actividades, sumales fotos, y calificalas con estrellas cuando las cumplan.',
  },
  {
    icon: '🎡',
    title: 'Dejá que la ruleta decida',
    description: '¿No saben qué hacer? Giren la ruleta y que el azar elija la próxima actividad.',
  },
  {
    icon: '🤝',
    title: 'Compartilo con alguien',
    description:
      'Invitá a otra persona con un código, y califíquense mutuamente como compañeros de aventura.',
  },
];

type Props = {
  onFinish: () => void;
};

export function OnboardingScreen({ onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  function handleNext() {
    if (isLast) {
      onFinish();
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.skipButton} onPress={onFinish}>
        <Text style={styles.skipButtonText}>Omitir</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.icon}>{slide.icon}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((s, i) => (
            <View key={s.title} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{isLast ? 'Empezar' : 'Siguiente'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  skipButtonText: {
    color: colors.inkMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 15,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cardBorder,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 16,
  },
  nextButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  nextButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
