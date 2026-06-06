import { ComponentType } from "react";
import { Session, SupabaseClient } from "@supabase/supabase-js";

export type TrackerModuleId = "tasks";

export interface TrackerModule {
  id: TrackerModuleId;
  label: string;
  description?: string;
  Component: ComponentType;
}

export interface TrackerContextValue {
  session: Session;
  userId: string;
  supabase: SupabaseClient;
  startLoading: () => void;
  stopLoading: () => void;
}
