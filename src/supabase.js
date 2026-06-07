import { createClient } from '@supabase/supabase-js'
 
// Nilai diambil dari file .env
// Pastikan sudah mengisi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
 
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[DayFlow] Supabase credentials belum diisi.\n' +
    'Salin file .env.example menjadi .env lalu isi URL dan ANON KEY dari Supabase dashboard.'
  )
}
 
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
 