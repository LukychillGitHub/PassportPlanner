import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Activity, Passport, Profile, Stamp } from '../types';

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
  }, []);

  // --- Pasaporte: se busca apenas hay sesión ---
  const loadPassport = useCallback(async (uid: string) => {
    setPassportLoading(true);
    const { data, error } = await supabase
      .from('passport_members')
      .select('passport:passports(id, name, invite_code, admin_pin)')
      .eq('user_id', uid)
      .limit(1)
      .maybeSingle();

    if (!error && data?.passport) {
      const row = data.passport as unknown as {
        id: string;
        name: string;
        invite_code: string;
        admin_pin: string;
      };
      setPassport({ id: row.id, name: row.name, inviteCode: row.invite_code });
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

      setPassport({ id: data.id, name: data.name, inviteCode: data.invite_code });
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
        .select('id, name, invite_code, admin_pin')
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

      setPassport({ id: data.id, name: data.name, inviteCode: data.invite_code });
      setAdminPin(data.admin_pin);
      return { ok: true };
    },
    [userId]
  );

  // --- Actividades y sellos del pasaporte actual, con sincronización en vivo ---
  const refetchData = useCallback(async (passportId: string) => {
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
  }, []);

  useEffect(() => {
    if (!passport) {
      setActivities([]);
      setStamps([]);
      return;
    }
    let cancelled = false;
    setDataLoading(true);

    refetchData(passport.id).finally(() => {
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
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [passport, refetchData]);

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
    },
    [passport, userId, refetchData]
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
