import { FinancePlaceholder } from "./types";

export const getFinancePlaceholder = (): FinancePlaceholder => ({
  status: "placeholder",
  message: "Finance tracking is staged for a future release.",
});
