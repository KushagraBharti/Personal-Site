import React from "react";
import { useIntroQuery } from "../../../hooks/usePortfolioQueries";

const AboutApp: React.FC = () => {
  const { data, isLoading, isError } = useIntroQuery();

  if (isLoading) {
    return <div className="h-full w-full animate-pulse bg-slate-950/40" />;
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950/40 text-sm text-slate-400">
        Unable to load profile overview.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto bg-slate-950/30 p-6 text-sm text-slate-200">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 md:flex-row md:items-center">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-100">Latest Update</h2>
          <p className="mt-2 text-sm text-slate-300">{data.latestUpdate}</p>
        </div>
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-xs uppercase tracking-wide text-slate-300">
          Fun Fact: {data.funFact}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold text-slate-100">Featured Blog</h3>
          <p className="mt-2 text-xs text-slate-300">
            <a href={data.featuredBlog.link} target="_blank" rel="noreferrer" className="text-accent-foreground hover:underline">
              {data.featuredBlog.title}
            </a>
          </p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold text-slate-100">Travel Plans</h3>
          <p className="mt-2 text-sm text-slate-300">{data.travelPlans}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold text-slate-100">AI Projects Spotlight</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
          {data.aiProjects.map((project) => (
            <li key={project}>{project}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AboutApp;
