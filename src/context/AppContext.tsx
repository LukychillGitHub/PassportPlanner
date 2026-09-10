import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { Activity, Companion, CompanionRating, Passport, Profile, Stamp } from '../types';

const DEFAULT_PIN = '1234';
const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres ambiguos (O/0, I/1)

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
  }
  return code;
}

type ActivityRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
};

type StampRow = {
  activity_id: string;
  rating: number;
  note: string;
  photo_urls: string[] | null;
  created_at: string;
};

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function toStamp(row: StampRow): Stamp {
  return {
    activityId: row.activity_id,
    rating: row.rating,
    note: row.note,
    photoUris: row.photo_urls ?? [],
    stampedAt: new Date(row.created_at).getTime(),
  };
}

type ProfileRow = {
  id: string;
  name: string;
  bio: string;
  photo_url: string | null;
};

type CompanionRatingRow = {
  rater_id: string;
  ratee_id: string;
  rating: number;
  note: string;
  updated_at: string;
};

function toCompanionRating(row: CompanionRatingRow): CompanionRating {
  return {
    raterId: row.rater_id,
    rateeId: row.ratee_id,
    rating: row.rating,
    note: row.note,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

type ActionResult = { ok: boolean; error?: string };

type AppContextValue = {
  // Autenticación
  authLoading: boolean;
  session: Session | null;
  pendingEmail: string | null;
  sendLoginCode: (email: string) => Promise<ActionResult>;
  verifyLoginCode: (code: string) => Promise<ActionResult>;
  cancelLogin: () => void;
  signOut: () => Promise<void>;

  // Pasaporte compartido
  passport: Passport | null;
  passportLoading: boolean;
  createPassport: (name: string) => Promise<ActionResult>;
  joinPassport: (inviteCode: string) => Promise<ActionResult>;

  // Datos del pasaporte
  loading: boolean;
  activities: Activity[];
  stamps: Stamp[];
  profile: Profile;
  isAdmin: boolean;

  // Compañero: otros miembros del pasaporte y las calificaciones mutuas
  companions: Companion[];
  companionRatings: CompanionRating[];
  rateCompanion: (rateeId: string, rating: number, note: string) => Promise<void>;
  getCompanionRating: (raterId: string, rateeId: string) => CompanionRating | undefined;
  isLeader: boolean;
  removeMember: (memberUserId: string) => Promise<ActionResult>;

  addActivity: (data: Omit<Activity, 'id' | 'createdAt'>) => Promise<void>;
  updateActivity: (id: string, data: Omit<Activity, 'id' | 'createdAt'>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  stampActivity: (activityId: string, rating: number, note: string, photoUris: string[]) => Promise<void>;
  removeStamp: (activityId: string) => Promise<void>;
  getStamp: (activityId: string) => Stamp | undefined;
  updateProfile: (data: Profile) => Promise<void>;
  loginAdmin: (pin: string) => Promise<boolean>;
  logoutAdmin: () => void;
  changeAdminPin: (newPin: string) => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const [passport, setPassport] = useState<Passport | null>(null);
  const [passportLoading, setPassportLoading] = useState(false);
  const [adminPin, setAdminPin] = useState(DEFAULT_PIN);
  const [isAdmin, setIsAdmin] = useState(false);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [profile, setProfile] = useState<Profile>({ name: '', bio: '', photoUri: null });
  const [dataLoading, setDataLoading] = useState(false);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [companionRatings, setCompanionRatings] = useState<CompanionRating[]>([]);

  const userId = session?.user?.id;

  // --- Sesión ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const sendLoginCode = useCallback(async (email: string): Promise<ActionResult> => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    if (error) return { ok: false, error: error.message };
    setPendingEmail(email.trim().toLowerCase());
    return { ok: true };
  }, []);

  const verifyLoginCode = useCallback(
    async (code: string): Promise<ActionResult> => {
      if (!pendingEmail) return { ok: false, error: 'No hay un email pendiente de verificación.' };
      const { error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: code.trim(),
        type: 'email',
      });
      if (error) return { ok: false, error: error.message };
      setPendingEmail(null);
      return { ok: true };
    },
    [pendingEmail]
  );

  const cancelLogin = useCallback(() => setPendingEmail(null), []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setPassport(null);
    setIsAdmin(false);
    setActivities([]);
    setStamps([]);
    setProfile({ name: '', bio: '', photoUri: null });
    setCompanions([]);
    setCompanionRatings([]);
  }, []);

  // --- Notificaciones push: avisarle al otro miembro del pasaporte cuando pasa algo ---
  const registerPushToken = useCallback(async (uid: string) => {
    try {
      const permission = await Notifications.getPermissionsAsync();
      let status = permission.status;
      if (status !== 'granted') {
        status = (await Notifications.requestPermissionsAsync()).status;
      }
      if (status !== 'granted') return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const { data: token } = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      await supabase
        .from('push_tokens')
        .upsert({ user_id: uid, token, updated_at: new Date().toISOString() });
    } catch {
      // Sin permiso, sin projectId (puede pasar en Expo Go) o sin conexión:
      // no es bloqueante, simplemente no se registra el token esta vez.
    }
  }, []);

  const notifyOthers = useCallback(
    async (passportId: string, excludeUserId: string, title: string, body: string) => {
      try {
        const { data: memberRows } = await supabase
          .from('passport_members')
          .select('user_id')
          .eq('passport_id', passportId);
        const targetIds = ((memberRows as { user_id: string }[] | null) ?? [])
          .map((r) => r.user_id)
          .filter((id) => id !== excludeUserId);
        if (targetIds.length === 0) return;

        const { data: tokenRows } = await supabase
          .from('push_tokens')
          .select('token')
          .in('user_id', targetIds);
        const tokens = ((tokenRows as { token: string }[] | null) ?? []).map((r) => r.token);
        if (tokens.length === 0) return;

        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(tokens.map((to) => ({ to, title, body, sound: 'default' }))),
        });
      } catch {
        // Si falla el envío del push no es crítico: la sincronización en vivo
        // sigue funcionando igual cuando la otra persona abre la app.
      }
    },
    []
  );

  // --- Pasaporte: se busca apenas hay sesión ---
  const loadPassport = useCallback(async (uid: string) => {
    setPassportLoading(true);
    const { data, error } = await supabase
      .from('passport_members')
      .select('passport:passports(id, name, invite_code, admin_pin, created_by)')
      .eq('user_id', uid)
      .limit(1)
      .maybeSingle();

    if (!error && data?.passport) {
      const row = data.passport as unknown as {
        id: string;
        name: string;
        invite_code: string;
        admin_pin: string;
        created_by: string;
      };
      setPassport({ id: row.id, name: row.name, inviteCode: row.invite_code, createdBy: row.created_by });
      setAdminPin(row.admin_pin);
    } else {
      setPassport(null);
    }
    setPassportLoading(false);
  }, []);

  useEffect(() => {
    if (userId) {
      loadPassport(userId);
    } else {
      setPassport(null);
    }
  }, [userId, loadPassport]);

  useEffect(() => {
    if (userId && passport) {
      registerPushToken(userId);
    }
  }, [userId, passport, registerPushToken]);

  const createPassport = useCallback(
    async (name: string): Promise<ActionResult> => {
      if (!userId) return { ok: false, error: 'No hay sesión activa.' };
      const inviteCode = generateInviteCode();
      const { data, error } = await supabase
        .from('passports')
        .insert({ name: name.trim() || 'Nuestro pasaporte', invite_code: inviteCode, created_by: userId })
        .select()
        .single();
      if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo crear el pasaporte.' };

      const { error: memberError } = await supabase
        .from('passport_members')
        .insert({ passport_id: data.id, user_id: userId });
      if (memberError) return { ok: false, error: memberError.message };

      setPassport({ id: data.id, name: data.name, inviteCode: data.invite_code, createdBy: data.created_by });
      setAdminPin(data.admin_pin);
      return { ok: true };
    },
    [userId]
  );

  const joinPassport = useCallback(
    async (inviteCode: string): Promise<ActionResult> => {
      if (!userId) return { ok: false, error: 'No hay sesión activa.' };
      const normalized = inviteCode.trim().toUpperCase();
      const { data, error } = await supabase
        .from('passports')
        .select('id, name, invite_code, admin_pin, created_by')
        .eq('invite_code', normalized)
        .maybeSingle();
      if (error || !data) {
        return { ok: false, error: 'No encontramos ningún pasaporte con ese código.' };
      }

      const { error: memberError } = await supabase
        .from('passport_members')
        .insert({ passport_id: data.id, user_id: userId });
      if (memberError && !memberError.message.toLowerCase().includes('duplicate')) {
        return { ok: false, error: memberError.message };
      }

      setPassport({ id: data.id, name: data.name, inviteCode: data.invite_code, createdBy: data.created_by });
      setAdminPin(data.admin_pin);
      await notifyOthers(data.id, userId, '¡Alguien se unió a tu pasaporte!', 'Ahora pueden compartir actividades juntos.');
      return { ok: true };
    },
    [userId, notifyOthers]
  );

  // --- Actividades y sellos del pasaporte actual, con sincronización en vivo ---
  const refetchData = useCallback(
    async (passportId: string) => {
      const [{ data: activityRows }, { data: stampRows }] = await Promise.all([
        supabase
          .from('activities')
          .select('*')
          .eq('passport_id', passportId)
          .order('created_at', { ascending: false }),
        supabase.from('stamps').select('*').eq('passport_id', passportId),
      ]);
      setActivities(((activityRows as ActivityRow[]) ?? []).map(toActivity));
      setStamps(((stampRows as StampRow[]) ?? []).map(toStamp));
    },
    []
  );

  // --- Otros miembros del pasaporte ("compañero") y las calificaciones mutuas ---
  const refetchCompanions = useCallback(
    async (passportId: string) => {
      const { data: memberRows } = await supabase
        .from('passport_members')
        .select('user_id')
        .eq('passport_id', passportId);
      const otherIds = ((memberRows as { user_id: string }[] | null) ?? [])
        .map((r) => r.user_id)
        .filter((id) => id !== userId);

      const [{ data: profileRows }, { data: ratingRows }] = await Promise.all([
        otherIds.length > 0
          ? supabase.from('profiles').select('*').in('id', otherIds)
          : Promise.resolve({ data: [] as ProfileRow[] }),
        supabase.from('companion_ratings').select('*').eq('passport_id', passportId),
      ]);

      setCompanions(
        ((profileRows as ProfileRow[] | null) ?? []).map((row) => ({
          userId: row.id,
          name: row.name,
          bio: row.bio,
          photoUri: row.photo_url,
        }))
      );
      setCompanionRatings(((ratingRows as CompanionRatingRow[]) ?? []).map(toCompanionRating));
    },
    [userId]
  );

  useEffect(() => {
    if (!passport) {
      setActivities([]);
      setStamps([]);
      setCompanions([]);
      setCompanionRatings([]);
      return;
    }
    let cancelled = false;
    setDataLoading(true);

    Promise.all([refetchData(passport.id), refetchCompanions(passport.id)]).finally(() => {
      if (!cancelled) setDataLoading(false);
    });

    const channel = supabase
      .channel(`passport-${passport.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities', filter: `passport_id=eq.${passport.id}` },
        () => refetchData(passport.id)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stamps', filter: `passport_id=eq.${passport.id}` },
        () => refetchData(passport.id)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companion_ratings', filter: `passport_id=eq.${passport.id}` },
        () => refetchCompanions(passport.id)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'passport_members', filter: `passport_id=eq.${passport.id}` },
        (payload) => {
          // Si la fila borrada es la mia, el lider me saco del pasaporte:
          // vuelvo a cargar mi membresia (que ahora no va a existir) en vez
          // de solo refrescar la lista de companeros.
          if (payload.old && (payload.old as { user_id?: string }).user_id === userId && userId) {
            loadPassport(userId);
          } else {
            refetchCompanions(passport.id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'passport_members', filter: `passport_id=eq.${passport.id}` },
        () => refetchCompanions(passport.id)
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [passport, refetchData, refetchCompanions, userId, loadPassport]);

  // --- Perfil ---
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        setProfile({ name: data.name, bio: data.bio, photoUri: data.photo_url });
      } else {
        await supabase.from('profiles').insert({ id: userId });
      }
    })();
  }, [userId]);

  const updateProfile = useCallback(
    async (data: Profile) => {
      if (!userId) return;
      setProfile(data);
      await supabase
        .from('profiles')
        .upsert({ id: userId, name: data.name, bio: data.bio, photo_url: data.photoUri });
    },
    [userId]
  );

  // --- CRUD de actividades ---
  const addActivity = useCallback(
    async (data: Omit<Activity, 'id' | 'createdAt'>) => {
      if (!passport || !userId) return;
      await supabase.from('activities').insert({ ...data, passport_id: passport.id, created_by: userId });
      await refetchData(passport.id);
    },
    [passport, userId, refetchData]
  );

  const updateActivity = useCallback(
    async (id: string, data: Omit<Activity, 'id' | 'createdAt'>) => {
      if (!passport) return;
      await supabase.from('activities').update(data).eq('id', id);
      await refetchData(passport.id);
    },
    [passport, refetchData]
  );

  const deleteActivity = useCallback(
    async (id: string) => {
      if (!passport) return;
      await supabase.from('activities').delete().eq('id', id);
      await refetchData(passport.id);
    },
    [passport, refetchData]
  );

  const stampActivity = useCallback(
    async (activityId: string, rating: number, note: string, photoUris: string[]) => {
      if (!passport || !userId) return;
      await supabase.from('stamps').upsert(
        {
          activity_id: activityId,
          passport_id: passport.id,
          sealed_by: userId,
          rating,
          note,
          photo_urls: photoUris,
        },
        { onConflict: 'activity_id' }
      );
      await refetchData(passport.id);
      const activityTitle = activities.find((a) => a.id === activityId)?.title;
      await notifyOthers(
        passport.id,
        userId,
        '¡Nueva actividad sellada!',
        activityTitle ? `Sellaron "${activityTitle}" en el pasaporte.` : 'Sellaron una actividad en el pasaporte.'
      );
    },
    [passport, userId, refetchData, activities, notifyOthers]
  );

  const removeStamp = useCallback(
    async (activityId: string) => {
      if (!passport) return;
      await supabase.from('stamps').delete().eq('activity_id', activityId);
      await refetchData(passport.id);
    },
    [passport, refetchData]
  );

  const getStamp = useCallback(
    (activityId: string) => stamps.find((s) => s.activityId === activityId),
    [stamps]
  );

  // --- Calificaciones de compañero ---
  const rateCompanion = useCallback(
    async (rateeId: string, rating: number, note: string) => {
      if (!passport || !userId) return;
      await supabase.from('companion_ratings').upsert(
        {
          passport_id: passport.id,
          rater_id: userId,
          ratee_id: rateeId,
          rating,
          note,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'passport_id,rater_id,ratee_id' }
      );
      await refetchCompanions(passport.id);
      await notifyOthers(
        passport.id,
        userId,
        'Te calificaron como compañero',
        'Andá a la pestaña Compañero para ver cuántas estrellas te pusieron.'
      );
    },
    [passport, userId, refetchCompanions, notifyOthers]
  );

  const getCompanionRating = useCallback(
    (raterId: string, rateeId: string) =>
      companionRatings.find((r) => r.raterId === raterId && r.rateeId === rateeId),
    [companionRatings]
  );

  const isLeader = !!(passport && userId && passport.createdBy === userId);

  const removeMember = useCallback(
    async (memberUserId: string): Promise<ActionResult> => {
      if (!passport) return { ok: false, error: 'No hay un pasaporte activo.' };
      const { error } = await supabase
        .from('passport_members')
        .delete()
        .eq('passport_id', passport.id)
        .eq('user_id', memberUserId);
      if (error) return { ok: false, error: error.message };
      await refetchCompanions(passport.id);
      return { ok: true };
    },
    [passport, refetchCompanions]
  );

  // --- Modo administrador (PIN del pasaporte) ---
  const loginAdmin = useCallback(
    async (pin: string) => {
      if (pin === adminPin) {
        setIsAdmin(true);
        return true;
      }
      return false;
    },
    [adminPin]
  );

  const logoutAdmin = useCallback(() => setIsAdmin(false), []);

  const changeAdminPin = useCallback(
    async (newPin: string) => {
      if (!passport) return;
      setAdminPin(newPin);
      await supabase.from('passports').update({ admin_pin: newPin }).eq('id', passport.id);
    },
    [passport]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      authLoading,
      session,
      pendingEmail,
      sendLoginCode,
      verifyLoginCode,
      cancelLogin,
      signOut,

      passport,
      passportLoading,
      createPassport,
      joinPassport,

      loading: dataLoading,
      activities,
      stamps,
      profile,
      isAdmin,
      companions,
      companionRatings,
      rateCompanion,
      getCompanionRating,
      isLeader,
      removeMember,
      addActivity,
      updateActivity,
      deleteActivity,
      stampActivity,
      removeStamp,
      getStamp,
      updateProfile,
      loginAdmin,
      logoutAdmin,
      changeAdminPin,
    }),
    [
      authLoading,
      session,
      pendingEmail,
      sendLoginCode,
      verifyLoginCode,
      cancelLogin,
      signOut,
      passport,
      passportLoading,
      createPassport,
      joinPassport,
      dataLoading,
      activities,
      stamps,
      profile,
      isAdmin,
      companions,
      companionRatings,
      rateCompanion,
      getCompanionRating,
      isLeader,
      removeMember,
      addActivity,
      updateActivity,
      deleteActivity,
      stampActivity,
      removeStamp,
      getStamp,
      updateProfile,
      loginAdmin,
      logoutAdmin,
      changeAdminPin,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}
