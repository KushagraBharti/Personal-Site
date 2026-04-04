export const importFresh = async <T>(modulePath: string): Promise<T> => {
  return (await import(modulePath)) as T;
};
