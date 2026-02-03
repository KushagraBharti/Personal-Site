import React from "react";
import GlassCard from "../../../../../components/ui/GlassCard";
import { sectionTitle } from "../../../shared/styles";
import { useFinanceModule } from "../hooks";

const FinanceTracker: React.FC = () => {
  const { message } = useFinanceModule();

  return (
    <GlassCard className="p-6">
      <h3 className={sectionTitle}>Finance Tracker</h3>
      <p className="mt-2 text-sm text-white/70">{message}</p>
    </GlassCard>
  );
};

export default FinanceTracker;
