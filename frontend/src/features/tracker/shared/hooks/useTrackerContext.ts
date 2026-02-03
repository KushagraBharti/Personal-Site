import { createContext, useContext } from "react";
import { TrackerContextValue } from "../types";

const TrackerContext = createContext<TrackerContextValue | null>(null);

export const TrackerProvider = TrackerContext.Provider;

export const useTrackerContext = () => {
  const ctx = useContext(TrackerContext);
  if (!ctx) {
    throw new Error("TrackerContext is missing. Wrap tracker modules with TrackerProvider.");
  }
  return ctx;
};
