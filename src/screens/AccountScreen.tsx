import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing } from '../theme';

export function AccountScreen() {
  const { profile, updateProfile, isAdmin, loginAdmin, logoutAdmin, activities, stamps } = useApp();
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [photoUri, setPhotoUri] = useState<string | null>(profile.photoUri);
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  const hasChanges = name !== profile.name || bio !== profile.bio || photoUri !== profile.photoUri;

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para elegir una imagen de perfil.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    await updateProfile({ name: name.trim(), bio: bio.trim(), photoUri });
    Alert.alert('Perfil guardado', 'Tus datos se actualizaron correctamente.');
  }

  async function handleAdminSubmit() {
    const ok = await loginAdmin(pin.trim());
    if (ok) {
      setPin('');
      setShowPinInput(false);
    } else {
      Alert.alert('PIN incorrecto', 'Probá de nuevo.');
    }
  }

  const totalStamps = stamps.length;
  const totalActivities = activities.length;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Mi cuenta</Text>

        <TouchableOpacity style={styles.avatarWrap} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>Elegir foto</Text>
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>✎</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="¿Cómo te llamás?"
          placeholderTextColor={colors.inkMuted}
        />

        <Text style={styles.label}>Sobre vos</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Contá un poco quién sos..."
          placeholderTextColor={colors.inkMuted}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges}
        >
          <Text style={styles.saveButtonText}>Guardar cambios</Text>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalStamps}</Text>
            <Text style={styles.statLabel}>Sellos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalActivities}</Text>
            <Text style={styles.statLabel}>Actividades</Text>
          </View>
        </View>

        <View style={styles.adminSection}>
          <Text style={styles.adminTitle}>Modo administrador</Text>
          {isAdmin ? (
            <View>
              <Text style={styles.adminActive}>✅ Modo admin activo. Podés agregar y editar actividades desde el Pasaporte.</Text>
              <TouchableOpacity style={styles.logoutButton} onPress={logoutAdmin}>
                <Text style={styles.logoutButtonText}>Salir del modo admin</Text>
              </TouchableOpacity>
            </View>
          ) : showPinInput ? (
            <View>
              <TextInput
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                placeholder="Ingresá el PIN"
                placeholderTextColor={colors.inkMuted}
                secureTextEntry
                keyboardType="number-pad"
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setShowPinInput(false);
                    setPin('');
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handleAdminSubmit}>
                  <Text style={styles.primaryButtonText}>Ingresar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.adminButton} onPress={() => setShowPinInput(true)}>
              <Text style={styles.adminButtonText}>Entrar como admin</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.gold,
  },
  avatarPlaceholder: {
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarBadgeText: {
    color: colors.white,
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  adminSection: {
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.lg,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  adminActive: {
    color: colors.success,
    marginBottom: spacing.sm,
  },
  adminButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  adminButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  logoutButton: {
    alignSelf: 'flex-start',
  },
  logoutButtonText: {
    color: colors.danger,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  secondaryButtonText: {
    color: colors.ink,
    fontWeight: '600',
  },
});
