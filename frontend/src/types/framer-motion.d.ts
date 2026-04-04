declare module "framer-motion" {
  import type { ComponentType, ReactNode } from "react";

  export type Variants = Record<string, unknown>;

  export const motion: Record<string, ComponentType<any>>;
  export const AnimatePresence: ComponentType<{ children?: ReactNode } & Record<string, unknown>>;
}
