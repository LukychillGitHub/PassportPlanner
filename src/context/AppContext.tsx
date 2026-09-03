import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Activity, Profile, Stamp } from '../types';
import { storage } from '../storage';

const DEFAULT_PIN = '1234';

const SEED_ACTIVITIES: Activity[] = [
  {
    id: 'seed-1',
    title: 'Picnic al atardecer',
    description: 'Llevar una manta y algo rico para comer al aire libre.',
    category: 'Aire libre',
    createdAt: Date.now(),
  },
  {
    id: 'seed-2',
    title: 'Noche de trivia',
    description: 'Armar equipos y competir con preguntas de cultura general.',
    category: 'En casa',
    createdAt: Date.now(),
  },
  {
    id: 'seed-3',
    title: 'Ruta gastronómica',
    description: 'Probar tres lugares nuevos para comer en el barrio.',
    category: 'Comida',
    createdAt: Date.now(),
  },
];

function generateId(): string {
  return `act-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type AppContextValue = {
  loading: boolean;
  activities: Activity[];
  stamps: Stamp[];
  profile: Profile;
  isAdmin: boolean;
  addActivity: (data: Omit<Activity, 'id' | 'createdAt'>) => Promise<void>;
  updateActivity: (id: string, data: Omit<Activity, 'id' | 'createdAt'>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  stampActivity: (activityId: string, rating: number, note: string, photoUri: string | null) => Promise<void>;
  removeStamp: (activityId: string) => Promise<void>;
  getStamp: (activityId: string) => Stamp | undefined;
  updateProfile: (data: Profile) => Promise<void>;
  loginAdmin: (pin: string) => Promise<boolean>;
  logoutAdmin: () => void;
  changeAdminPin: (newPin: string) => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [profile, setProfile] = useState<Profile>({ name: '', bio: '', photoUri: null });
  const [adminPin, setAdminPin] = useState(DEFAULT_PIN);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const [loadedActivities, loadedStamps, loadedProfile, loadedPin] = await Promise.all([
        storage.readJson<Activity[]>(storage.keys.activities, SEED_ACTIVITIES),
        storage.readJson<Stamp[]>(storage.keys.stamps, []),
        storage.readJson<Profile>(storage.keys.profile, { name: '', bio: '', photoUri: null }),
        storage.readJson<string>(storage.keys.adminPin, DEFAULT_PIN),
      ]);
      setActivities(loadedActivities);
      setStamps(loadedStamps);
      setProfile(loadedProfile);
      setAdminPin(loadedPin);
      setLoading(false);
    })();
  }, []);

  const persistActivities = useCallback(async (next: Activity[]) => {
    setActivities(next);
    await storage.writeJson(storage.keys.activities, next);
  }, []);

  const persistStamps = useCallback(async (next: Stamp[]) => {
    setStamps(next);
    await storage.writeJson(storage.keys.stamps, next);
  }, []);

  const addActivity = useCallback(
    async (data: Omit<Activity, 'id' | 'createdAt'>) => {
      const newActivity: Activity = { ...data, id: generateId(), createdAt: Date.now() };
      await persistActivities([newActivity, ...activities]);
    },
    [activities, persistActivities]
  );

  const updateActivity = useCallback(
    async (id: string, data: Omit<Activity, 'id' | 'createdAt'>) => {
      const next = activities.map((a) => (a.id === id ? { ...a, ...data } : a));
      await persistActivities(next);
    },
    [activities, persistActivities]
  );

  const deleteActivity = useCallback(
    async (id: string) => {
      await persistActivities(activities.filter((a) => a.id !== id));
      await persistStamps(stamps.filter((s) => s.activityId !== id));
    },
    [activities, stamps, persistActivities, persistStamps]
  );

  const stampActivity = useCallback(
    async (activityId: string, rating: number, note: string, photoUri: string | null) => {
      const next = [
        ...stamps.filter((s) => s.activityId !== activityId),
        { activityId, rating, note, photoUri, stampedAt: Date.now() },
      ];
      await persistStamps(next);
    },
    [stamps, persistStamps]
  );

  const removeStamp = useCallback(
    async (activityId: string) => {
      await persistStamps(stamps.filter((s) => s.activityId !== activityId));
    },
    [stamps, persistStamps]
  );

  const getStamp = useCallback(
    (activityId: string) => stamps.find((s) => s.activityId === activityId),
    [stamps]
  );

  const updateProfile = useCallback(async (data: Profile) => {
    setProfile(data);
    await storage.writeJson(storage.keys.profile, data);
  }, []);

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

  const changeAdminPin = useCallback(async (newPin: string) => {
    setAdminPin(newPin);
    await storage.writeJson(storage.keys.adminPin, newPin);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      loading,
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
      loading,
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
