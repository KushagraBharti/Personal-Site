export const importFresh = async <T>(
  loader: () => Promise<T>,
  env: Record<string, string | undefined> = {},
) => {
  const nextEnv = { ...process.env };
  Object.entries(env).forEach(([key, value]) => {
    if (value === undefined) {
      delete nextEnv[key];
      return;
    }
    nextEnv[key] = value;
  });

  process.env = nextEnv;
  return await loader();
};
