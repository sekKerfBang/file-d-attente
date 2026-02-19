export interface Doctor {
  id: string
  first_name: string
  last_name: string
  specialty: string
  room_number: string
  is_active: boolean
  current_patient: string | null
  current_patient_details?: {
    id: string
    ticket_number: string
    name: string
    priority: number
  } | null
}

export interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  phone: string
  email: string
  priority: number
  priority_display: string
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled'
  status_display: string
  ticket_number: string
  estimated_wait_time: number
  created_at: string
  called_at: string | null
  completed_at: string | null
  assigned_doctor: string | null
  doctor_name: string | null
  notes: string
  wait_time_minutes: number
}

export interface QueueStats {
  total_waiting: number
  total_in_progress: number
  total_completed_today: number
  average_wait_time: number
  urgent_count: number
}

export interface WebSocketMessage {
  type: string
  [key: string]: unknown
}