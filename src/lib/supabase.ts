import 'react-native-url-polyfill/auto';
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
