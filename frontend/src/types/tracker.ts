// frontend/src/types/tracker.ts

export type TabKey = "thisWeek" | "deals" | "wins";

export interface TaskTemplate {
  id: string;
  user_id: string;
  category: string;
  text: string;
  sort_order: number;
  active: boolean;
  created_at?: string;
}

export interface TaskStatus {
  id: string;
  week_start: string;
  task_id: string;
  completed: boolean;
  proof_url: string | null;
  note: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklySnapshot {
  week_start: string;
  build_milestone: string | null;
  best_demo_hook_url: string | null;
  best_demo_walkthrough_url: string | null;
  paid_work_progress: string | null;
  traction_progress: string | null;
  next_week_focus: string | null;
  build_outcome?: string | null;
  internship_outcome?: string | null;
  traction_outcome?: string | null;
}

export type PipelineType = "internship" | "relationship" | "traction";

export interface PipelineItem {
  id: string;
  type: PipelineType;
  name: string;
  stage: string;
  last_touch: string | null;
  next_action: string;
  next_action_date: string | null;
  links: string[] | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  archived?: boolean;
}

export interface ProofVaultItem {
  id: string;
  title: string;
  url: string;
  tag: string | null;
  pinned: boolean;
  sort_order: number;
}

export interface EvidenceLogItem {
  id: string;
  date: string;
  type: string;
  link: string | null;
  note: string | null;
  proof_url?: string | null;
}

export interface MobilityRoute {
  id: string;
  route_name: string;
  is_primary: boolean;
  status: string;
  next_missing_item: string | null;
  next_action_date: string | null;
  notes: string | null;
}
