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