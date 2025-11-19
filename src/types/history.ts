// types/history.ts
export interface DeviceHistoryRecord {
  id: string;
  device_id: string;
  site_id: string;
  sensors: {
    temperature?: number;
    humidity?: number;
    air_quality?: number;
    light?: number;
    sound?: number;
  };
  ieq_score?: number;
  processed_at: string;
  timestamp?: string;
}

export interface ExerciseHistoryRecord {
  id: string;
  exercise_id?: string;
  exercise_name?: string;
  name?: string;
  completed_at?: string;
  created_at?: string;
  timestamp?: string;
  duration_minutes?: number;
  duration?: number;
  steps_completed?: number;
  total_steps?: number;
  notes?: string;
  status?: string;
}

export interface TransformedHistoryItem {
  type: "device" | "exercise";
  title: string;
  timestamp: string;
  status: string;
  score?: number;
  duration?: number;
  steps_completed?: number;
  total_steps?: number;
  notes?: string;
  // Include original fields for device data
  id?: string;
  device_id?: string;
  sensors?: any;
  ieq_score?: number;
  processed_at?: string;
  exercise_id?: string;
  exercise_name?: string;
  name?: string;
  completed_at?: string;
  created_at?: string;
  duration_minutes?: number;
}
