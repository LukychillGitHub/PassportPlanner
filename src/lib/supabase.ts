import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tordvdesfpgahqhyvrxh.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcmR2ZGVzZnBnYWhxaHl2cnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MTY0NzcsImV4cCI6MjEwNDA5MjQ3N30.rUeK2wGco85Znj9LezwdeQL9097HjoC0hRVXboVu7m4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// En React Native los timers no corren con la app en segundo plano, así que
// el token vencía y, al volver, las consultas daban 401 (y la app creía que no
// tenías pasaporte). Supabase pide renovar la sesión al volver a primer plano.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
