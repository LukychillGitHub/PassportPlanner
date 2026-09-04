import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing } from '../theme';

export function PassportSetupScreen() {
  const { createPassport, joinPassport, signOut } = useApp();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    setBusy(true);
    const result = await createPassport(name);
    setBusy(false);
    if (!result.ok) {
      Alert.alert('No se pudo crear el pasaporte', result.error ?? 'Probá de nuevo.');
    }
  }

  async function handleJoin() {
    if (!code.trim()) return;
    setBusy(true);
    const result = await joinPassport(code);
    setBusy(false);
    if (!result.ok) {
      Alert.alert('No pudimos unirte', result.error ?? 'Revisá el código y probá de nuevo.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.stampIcon}>📘</Text>
        <Text style={styles.title}>Tu pasaporte compartido</Text>

        {mode === 'choose' && (
          <>
            <Text style={styles.subtitle}>
              Creá un pasaporte nuevo para compartir con alguien, o unite a uno con un código de invitación.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setMode('create')}>
              <Text style={styles.primaryButtonText}>Crear un pasaporte nuevo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineButton} onPress={() => setMode('join')}>
              <Text style={styles.outlineButtonText}>Unirme con un código</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={signOut}>
              <Text style={styles.secondaryButtonText}>Salir de la cuenta</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === 'create' && (
          <>
            <Text style={styles.subtitle}>Ponele un nombre a tu pasaporte (podés cambiarlo después).</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ej: Nuestro pasaporte"
              placeholderTextColor={colors.inkMuted}
            />
            <TouchableOpacity
              style={[styles.primaryButton, busy && styles.disabledButton]}
              onPress={handleCreate}
              disabled={busy}
            >
              <Text style={styles.primaryButtonText}>{busy ? 'Creando...' : 'Crear pasaporte'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setMode('choose')} disabled={busy}>
              <Text style={styles.secondaryButtonText}>Volver</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === 'join' && (
          <>
            <Text style={styles.subtitle}>Ingresá el código de invitación que te compartieron.</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={setCode}
              placeholder="ABC123"
              placeholderTextColor={colors.inkMuted}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.primaryButton, (!code.trim() || busy) && styles.disabledButton]}
              onPress={handleJoin}
              disabled={!code.trim() || busy}
            >
              <Text style={styles.primaryButtonText}>{busy ? 'Uniéndote...' : 'Unirme'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setMode('choose')} disabled={busy}>
              <Text style={styles.secondaryButtonText}>Volver</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  stampIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.ink,
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 6,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  outlineButton: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.inkMuted,
    fontWeight: '600',
  },
});
