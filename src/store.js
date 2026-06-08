import { create } from 'zustand';
import { supabase } from './lib/supabase';
import { startOfWeek, endOfWeek, format } from 'date-fns';

// ==========================================
// 1. AUTH STORE
// ==========================================
export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ user: data.user });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  }
}));

// ==========================================
// 2. TASK STORE
// ==========================================
export const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  fetchTasks: async (userId) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) set({ error: error.message });
    set({ tasks: data || [], loading: false });
  },
  addTask: async (userId, task) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('tasks').insert({ ...task, user_id: userId }).select();
    if (error) { set({ error: error.message, loading: false }); throw error; }
    await get().fetchTasks(userId);
    return data[0]; // Mengembalikan task yang baru dibuat untuk kebutuhan chaining
  },
  toggleTask: async (userId, id, is_done) => {
    const { error } = await supabase.from('tasks').update({ is_done }).eq('id', id);
    if (error) { set({ error: error.message }); throw error; }
    await get().fetchTasks(userId);
    
    // Pemicu Notifikasi WA Otomatis saat task selesai (Opsional/Sistem Log)
    const task = get().tasks.find(t => t.id === id);
    if (is_done && task) {
      get().sendWhatsAppNotification(userId, `Hore! Task "${task.title}" telah selesai dikerjakan! 🎉`);
    }
  },
  removeTask: async (userId, id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) { set({ error: error.message }); throw error; }
    await get().fetchTasks(userId);
  },
  // TRIGGER NOTIFIKASI WHATSAPP
  sendWhatsAppNotification: async (userId, message) => {
    try {
      // Mengirim request ke Supabase Edge Function Anda / API Gateway Gateway WA (Fonnte/Wablas/Zenziva)
      await supabase.functions.invoke('send-whatsapp', {
        body: { userId, message },
      });
    } catch (err) {
      console.error("Gagal mengirim notifikasi WA:", err);
    }
  }
}));

// ==========================================
// 3. HABIT & GAMIFICATION STORE
// ==========================================
export const useHabitStore = create((set, get) => ({
  habits: [],
  gardenScore: 0, // State untuk Gamifikasi Kebun 🌿
  loading: false,
  error: null,
  
  fetchHabits: async (userId) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) set({ error: error.message });
    set({ habits: data || [], loading: false });
    get().calculateGardenScore(); // Hitung skor kebun setelah mengambil data
  },
  addHabit: async (userId, habit) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('habits').insert({ ...habit, user_id: userId });
    if (error) { set({ error: error.message, loading: false }); throw error; }
    await get().fetchHabits(userId);
  },
  removeHabit: async (userId, id) => {
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (error) { set({ error: error.message }); throw error; }
    await get().fetchHabits(userId);
  },
  
  // LOGIKA STREAK & PENGECEKAN MINGGUAN (FLEKSIBEL)
  getStreak: (habitId, habitLogs) => {
    if (!habitLogs || habitLogs.length === 0) return 0;
    const currentHabit = get().habits.find(h => h.id === habitId);
    if (!currentHabit) return 0;

    let streak = 0;
    let checkDate = new Date();
    
    if (currentHabit.frequency === 'daily') {
      while (true) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        const hasLog = habitLogs.some(l => l.habit_id === habitId && format(new Date(l.created_at), 'yyyy-MM-dd') === dateStr);
        if (hasLog) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // Toleransi jika hari ini belum mencatat progress, cek hari kemarin
          if (dateStr === format(new Date(), 'yyyy-MM-dd')) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
          break;
        }
      }
    }
    return streak;
  },

  // LOGIKA PERTUMBUHAN KEBUN GAMIFIKASI 🌿
  calculateGardenScore: () => {
    const habits = get().habits;
    // Nilai kebun dihitung dari total akumulasi habit yang dibuat & konsistensinya
    let score = habits.length * 15; 
    set({ gardenScore: score });
  }
}));

// ==========================================
// 4. SCHEDULE STORE (Time Blocking + Link Task)
// ==========================================
export const useScheduleStore = create((set, get) => ({
  schedules: [],
  loading: false,
  error: null,
  fetchSchedules: async (userId) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('schedule_blocks').select('*').eq('user_id', userId).order('start_time', { ascending: true });
    if (error) set({ error: error.message });
    set({ schedules: data || [], loading: false });
  },
  addSchedule: async (userId, schedule) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('schedule_blocks').insert({ ...schedule, user_id: userId });
    if (error) { set({ error: error.message, loading: false }); throw error; }
    await get().fetchSchedules(userId);
    
    // Mengirim pengingat WhatsApp terjadwal otomatis
    useTaskStore.getState().sendWhatsAppNotification(
      userId, 
      `⏰ Pengingat Jadwal: Blok kegiatan "${schedule.title}" dijadwalkan pada jam ${schedule.start_time} hari ini. Tetap fokus ya! ✨`
    );
  },
  removeSchedule: async (userId, id) => {
    const { error } = await supabase.from('schedule_blocks').delete().eq('id', id);
    if (error) { set({ error: error.message }); throw error; }
    await get().fetchSchedules(userId);
  }
}));

// ==========================================
// 5. HABIT LOG STORE
// ==========================================
export const useHabitLogStore = create((set, get) => ({
  habitLogs: [],
  loading: false,
  error: null,
  fetchHabitLogs: async (userId) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('habit_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) set({ error: error.message });
    set({ habitLogs: data || [], loading: false });
  },
  addHabitLog: async (userId, logData) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('habit_logs').insert({ ...logData, user_id: userId });
    if (error) { set({ error: error.message, loading: false }); throw error; }
    await get().fetchHabitLogs(userId);
    useHabitStore.getState().calculateGardenScore(); // Perbarui level kebun saat habit dicatat
  }
}));