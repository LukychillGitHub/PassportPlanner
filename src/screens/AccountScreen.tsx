import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing } from '../theme';
import { ImageCropperModal } from '../components/ImageCropperModal';
import { storage } from '../storage';

const REMINDER_WEEKDAY = 1; // domingo
const REMINDER_HOUR = 18;
const REMINDER_MINUTE = 0;

export function AccountScreen() {
  const {
    profile,
    updateProfile,
    isAdmin,
    loginAdmin,
    logoutAdmin,
    changeAdminPin,
    activities,
    stamps,
    passport,
    signOut,
  } = useApp();
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [photoUri, setPhotoUri] = useState<string | null>(profile.photoUri);
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [pickedPhotoUri, setPickedPhotoUri] = useState<string | null>(null);
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);

  const hasChanges = name !== profile.name || bio !== profile.bio || photoUri !== profile.photoUri;

  useEffect(() => {
    storage.readJson<boolean>(storage.keys.reminderEnabled, false).then(setReminderEnabled);
  }, []);

  async function toggleReminder(value: boolean) {
    setReminderBusy(true);
    try {
      if (value) {
        const permission = await Notifications.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permiso necesario', 'Necesitamos permiso para enviarte el recordatorio semanal.');
          return;
        }
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Tu pasaporte te espera',
            body: '¿Ya elegiste tu próxima actividad? Girá la ruleta o sellá un plan pendiente.',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: REMINDER_WEEKDAY,
            hour: REMINDER_HOUR,
            minute: REMINDER_MINUTE,
          },
        });
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
      setReminderEnabled(value);
      await storage.writeJson(storage.keys.reminderEnabled, value);
    } finally {
      setReminderBusy(false);
    }
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para elegir una imagen de perfil.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPickedPhotoUri(result.assets[0].uri);
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

  async function handleShareInvite() {
    if (!passport) return;
    try {
      await Share.share({
        message: `Sumate a mi pasaporte "${passport.name}" en PassportPlanner. Código de invitación: ${passport.inviteCode}`,
      });
    } catch {
      // el usuario canceló el share sheet, no hace falta avisar
    }
  }

  async function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Seguro que querés salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut },
    ]);
  }

  async function handlePinChange() {
    if (newPin.trim().length < 4) {
      Alert.alert('PIN muy corto', 'Elegí un PIN de al menos 4 dígitos.');
      return;
    }
    if (newPin.trim() !== confirmPin.trim()) {
      Alert.alert('Los PIN no coinciden', 'Revisá que ambos campos sean iguales.');
      return;
    }
    await changeAdminPin(newPin.trim());
    setNewPin('');
    setConfirmPin('');
    setShowPinChange(false);
    Alert.alert('PIN actualizado', 'Tu nuevo PIN de administrador ya está activo.');
  }

  const totalStamps = stamps.length;
  const totalActivities = activities.length;

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Mi cuenta</Text>

        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={pickPhoto}
          accessibilityRole="button"
          accessibilityLabel="Cambiar foto de perfil"
        >
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

        {passport && (
          <View style={styles.reminderSection}>
            <Text style={styles.adminTitle}>Pasaporte compartido</Text>
            <Text style={styles.reminderHint}>
              Compartí este código con quien quieras sumar a "{passport.name}".
            </Text>
            <View style={styles.inviteCodeBox}>
              <Text style={styles.inviteCodeText}>{passport.inviteCode}</Text>
            </View>
            <TouchableOpacity style={styles.outlineButton} onPress={handleShareInvite}>
              <Text style={styles.outlineButtonText}>Compartir código</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.reminderSection}>
          <View style={styles.reminderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminTitle}>Recordatorio semanal</Text>
              <Text style={styles.reminderHint}>Te avisamos los domingos para que elijas tu próxima actividad.</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={toggleReminder}
              disabled={reminderBusy}
              accessibilityLabel="Activar recordatorio semanal"
            />
          </View>
        </View>

        <View style={styles.adminSection}>
          <Text style={styles.adminTitle}>Modo administrador</Text>
          {isAdmin ? (
            <View>
              <Text style={styles.adminActive}>✅ Modo admin activo. Podés agregar y editar actividades desde el Pasaporte.</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.logoutButton} onPress={logoutAdmin}>
                  <Text style={styles.logoutButtonText}>Salir del modo admin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={() => setShowPinChange((v) => !v)}
                >
                  <Text style={styles.changePinLink}>{showPinChange ? 'Cancelar' : 'Cambiar PIN'}</Text>
                </TouchableOpacity>
              </View>

              {showPinChange && (
                <View style={styles.pinChangeBox}>
                  <TextInput
                    style={styles.input}
                    value={newPin}
                    onChangeText={setNewPin}
                    placeholder="Nuevo PIN"
                    placeholderTextColor={colors.inkMuted}
                    secureTextEntry
                    keyboardType="number-pad"
                  />
                  <TextInput
                    style={[styles.input, { marginTop: spacing.sm }]}
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                    placeholder="Confirmá el nuevo PIN"
                    placeholderTextColor={colors.inkMuted}
                    secureTextEntry
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity style={styles.saveButton} onPress={handlePinChange}>
                    <Text style={styles.saveButtonText}>Guardar nuevo PIN</Text>
                  </TouchableOpacity>
                </View>
              )}
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

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      <ImageCropperModal
        visible={!!pickedPhotoUri}
        imageUri={pickedPhotoUri}
        aspect={1}
        shape="circle"
        onCancel={() => setPickedPhotoUri(null)}
        onConfirm={(croppedUri) => {
          setPhotoUri(croppedUri);
          setPickedPhotoUri(null);
        }}
      />
    </KeyboardAvoidingView>
    </SafeAreaView>
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
  reminderSection: {
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.lg,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  reminderHint: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  changePinLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  inviteCodeBox: {
    marginTop: spacing.md,
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  inviteCodeText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 6,
    color: colors.ink,
  },
  outlineButton: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  signOutButton: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: colors.danger,
    fontWeight: '600',
  },
  pinChangeBox: {
    marginTop: spacing.md,
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
