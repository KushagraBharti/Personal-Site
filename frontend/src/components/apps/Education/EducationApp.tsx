import React from "react";
import { useEducationQuery } from "../../../hooks/usePortfolioQueries";

const EducationApp: React.FC = () => {
  const { data, isLoading, isError } = useEducationQuery();

  if (isLoading) {
    return (
      <div className="space-y-4 bg-slate-950/30 p-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-lg border border-slate-800/60 bg-slate-900/40" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950/30 text-sm text-slate-400">
        Unable to load education history.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-slate-950/30 p-6">
      <div className="space-y-4">
        {data.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 shadow-sm shadow-slate-900/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-100">{item.position}</h3>
              <span className="text-xs text-slate-400">{item.dateRange}</span>
            </div>
            <p className="mt-1 text-xs text-slate-300">{item.focus}</p>
            <p className="mt-2 text-sm text-slate-300">{item.description}</p>
            <div className="mt-3">
              <a
                href={item.schoolLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-accent-foreground hover:underline"
              >
                Visit Institution
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EducationApp;
