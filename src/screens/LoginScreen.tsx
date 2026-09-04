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

export function LoginScreen() {
  const { pendingEmail, sendLoginCode, verifyLoginCode, cancelLogin } = useApp();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSendCode() {
    if (!email.trim()) return;
    setBusy(true);
    const result = await sendLoginCode(email);
    setBusy(false);
    if (!result.ok) {
      Alert.alert('No pudimos enviar el código', result.error ?? 'Probá de nuevo.');
    }
  }

  async function handleVerifyCode() {
    if (!code.trim()) return;
    setBusy(true);
    const result = await verifyLoginCode(code);
    setBusy(false);
    if (!result.ok) {
      Alert.alert('Código incorrecto', result.error ?? 'Revisá el código y probá de nuevo.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.stampIcon}>🛂</Text>
        <Text style={styles.title}>PassportPlanner</Text>

        {!pendingEmail ? (
          <>
            <Text style={styles.subtitle}>Ingresá tu email para entrar o crear tu cuenta.</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={colors.inkMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TouchableOpacity
              style={[styles.primaryButton, (!email.trim() || busy) && styles.disabledButton]}
              onPress={handleSendCode}
              disabled={!email.trim() || busy}
            >
              <Text style={styles.primaryButtonText}>{busy ? 'Enviando...' : 'Enviarme un código'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Te enviamos un código a {pendingEmail}. Ingresalo acá abajo.
            </Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor={colors.inkMuted}
              keyboardType="number-pad"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.primaryButton, (!code.trim() || busy) && styles.disabledButton]}
              onPress={handleVerifyCode}
              disabled={!code.trim() || busy}
            >
              <Text style={styles.primaryButtonText}>{busy ? 'Verificando...' : 'Ingresar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={cancelLogin} disabled={busy}>
              <Text style={styles.secondaryButtonText}>Usar otro email</Text>
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
    fontSize: 26,
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
  secondaryButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.inkMuted,
    fontWeight: '600',
  },
});
