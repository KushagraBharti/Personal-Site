import React from "react";
import { useExperienceQuery } from "../../../hooks/usePortfolioQueries";

const ExperienceApp: React.FC = () => {
  const { data, isLoading, isError } = useExperienceQuery();

  if (isLoading) {
    return (
      <div className="space-y-4 bg-slate-950/40 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg border border-slate-800/60 bg-slate-900/40" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950/40 text-sm text-slate-400">
        Unable to load experience timeline.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-slate-950/30 p-6">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-700/50" aria-hidden />
        <div className="space-y-6">
          {data.map((item, index) => (
            <div key={index} className="relative pl-12">
              <div className="absolute left-3 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full border border-accent/60 bg-slate-950" />
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-100">{item.position}</h3>
                  <a
                    href={item.companyLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-accent-foreground hover:underline"
                  >
                    View Company
                  </a>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.summary}</p>
                <ul className="mt-3 space-y-2 text-xs text-slate-300">
                  {item.description.map((entry, entryIndex) => (
                    <li key={entryIndex} className="leading-relaxed">
                      {entry}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-slate-800/60 px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExperienceApp;
