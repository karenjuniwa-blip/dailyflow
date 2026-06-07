import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { format, subDays } from 'date-fns'

// Helper: tanggal hari ini dalam format yyyy-MM-dd
const todayStr = () => format(new Date(), 'yyyy-MM-dd')

// ─── AUTH STORE ───────────────────────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    set({ user: data.user })
    return data.user
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))

// ─── TASK STORE ───────────────────────────────────────────────────────────────
export const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  // Ambil semua task milik user
  fetch: async (userId) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) { set({ error: error.message, loading: false }); return }
    set({ tasks: data ?? [], loading: false })
  },

  // Tambah task baru
  add: async (userId, { title, category, scheduled_at }) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ user_id: userId, title, category, scheduled_at })
      .select()
      .single()
    if (error) throw error
    set((s) => ({ tasks: [data, ...s.tasks] }))
    return data
  },

  // Toggle selesai / belum
  toggle: async (id, isDone) => {
    set((s) => ({
      tasks: s.tasks.map((t) => t.id === id ? { ...t, is_done: isDone } : t),
    }))
    const { error } = await supabase
      .from('tasks')
      .update({ is_done: isDone })
      .eq('id', id)
    if (error) {
      // Rollback jika gagal
      set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? { ...t, is_done: !isDone } : t),
      }))
    }
  },

  // Hapus task
  remove: async (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    await supabase.from('tasks').delete().eq('id', id)
  },

  // Getter: task untuk tanggal tertentu
  getByDate: (dateStr) => {
    return get().tasks.filter((t) => {
      if (!t.scheduled_at) return false
      return format(new Date(t.scheduled_at), 'yyyy-MM-dd') === dateStr
    })
  },

  // Getter: task tanpa jadwal (inbox)
  getInbox: () => {
    return get().tasks.filter((t) => !t.scheduled_at)
  },
}))

// ─── SCHEDULE STORE ───────────────────────────────────────────────────────────
export const useScheduleStore = create((set, get) => ({
  blocks: [],
  loading: false,

  fetch: async (userId, date) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('schedule_blocks')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('start_time', { ascending: true })

    if (error) { set({ loading: false }); return }
    set({ blocks: data ?? [], loading: false })
  },

  add: async (userId, block) => {
    const { data, error } = await supabase
      .from('schedule_blocks')
      .insert({ user_id: userId, ...block })
      .select()
      .single()
    if (error) throw error
    set((s) => ({
      blocks: [...s.blocks, data].sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      ),
    }))
    return data
  },

  remove: async (id) => {
    set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) }))
    await supabase.from('schedule_blocks').delete().eq('id', id)
  },
}))

// ─── HABIT STORE ──────────────────────────────────────────────────────────────
export const useHabitStore = create((set, get) => ({
  habits: [],
  // logs: { [habitId]: { [dateStr]: logObject } }
  logs: {},
  loading: false,

  // Fetch semua habit + log tahun ini
  fetch: async (userId) => {
    set({ loading: true })

    const [{ data: habits }, { data: logs }] = await Promise.all([
      supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', `${new Date().getFullYear()}-01-01`),
    ])

    // Susun logs ke dalam map { habitId: { dateStr: logObj } }
    const logsMap = {}
    ;(logs ?? []).forEach((l) => {
      if (!logsMap[l.habit_id]) logsMap[l.habit_id] = {}
      logsMap[l.habit_id][l.log_date] = l
    })

    set({ habits: habits ?? [], logs: logsMap, loading: false })
  },

  // Tambah habit baru
  add: async (userId, habitData) => {
    const { data, error } = await supabase
      .from('habits')
      .insert({ user_id: userId, ...habitData })
      .select()
      .single()
    if (error) throw error
    set((s) => ({ habits: [...s.habits, data] }))
    return data
  },

  // Catat log (upsert — bisa dipanggil berkali-kali sehari)
  log: async (userId, habitId, value, date = todayStr()) => {
    const { data, error } = await supabase
      .from('habit_logs')
      .upsert(
        { user_id: userId, habit_id: habitId, log_date: date, value },
        { onConflict: 'habit_id,log_date' }
      )
      .select()
      .single()
    if (error) throw error

    // Update local state langsung (optimistic)
    set((s) => ({
      logs: {
        ...s.logs,
        [habitId]: {
          ...(s.logs[habitId] ?? {}),
          [date]: data,
        },
      },
    }))
    return data
  },

  // Getter: log untuk satu habit pada tanggal tertentu
  getLog: (habitId, date = todayStr()) => {
    return get().logs[habitId]?.[date] ?? null
  },

  // Getter: streak berturut-turut (mundur dari hari ini)
  getStreak: (habitId) => {
    const hLogs = get().logs[habitId] ?? {}
    let streak = 0
    const d = new Date()
    while (true) {
      const key = format(d, 'yyyy-MM-dd')
      if (hLogs[key]) {
        streak++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  },

  // Getter: best streak (scan semua log)
  getBestStreak: (habitId) => {
    const hLogs = get().logs[habitId] ?? {}
    const dates = Object.keys(hLogs).sort()
    if (!dates.length) return 0

    let best = 1, cur = 1
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1])
      const curr = new Date(dates[i])
      const diff = (curr - prev) / (1000 * 60 * 60 * 24)
      if (diff === 1) { cur++; if (cur > best) best = cur }
      else cur = 1
    }
    return best
  },

  // Getter: semua log dalam satu bulan { day: logObj }
  getMonthLogs: (habitId, year, month) => {
    const hLogs = get().logs[habitId] ?? {}
    const result = {}
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const key = format(new Date(year, month, d), 'yyyy-MM-dd')
      if (hLogs[key]) result[d] = hLogs[key]
    }
    return result
  },

  // Nonaktifkan habit (soft delete)
  deactivate: async (id) => {
    await supabase.from('habits').update({ is_active: false }).eq('id', id)
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }))
  },
}))