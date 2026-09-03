import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  activities: '@passportplanner/activities',
  stamps: '@passportplanner/stamps',
  profile: '@passportplanner/profile',
  adminPin: '@passportplanner/adminPin',
} as const;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  keys: KEYS,
  readJson,
  writeJson,
};
