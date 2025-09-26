import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Application = {
  id: string
  from_id: string
  name: string
  kana: string
  phone: string
  email: string
  address: string
  work_history: string
  desired_conditions: string
  status: string
  person_in_charge: string | null
  interview_date: string | null
  interview_time: string | null
  interview_location: string | null
  interview_notes: string | null
  created_at: string
  updated_at: string
}

export type Staff = {
  id: string
  name: string
  employee_id: string
  department: string | null
  position: string | null
  status: string
  created_at: string
  updated_at: string
}

export type Attendance = {
  id: string
  staff_id: string
  staff_name: string
  date: string
  clock_in_time: string | null
  clock_out_time: string | null
  break_start_time: string | null
  break_end_time: string | null
  work_location: string | null
  notes: string | null
  status: string
  created_at: string
  updated_at: string
}