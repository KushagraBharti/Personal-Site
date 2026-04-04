export const DATE_ONLY_MARKER_MS = 777;

const DATE_ONLY_INPUT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const toIsoOrNull = (dateTimeLocal: string): string | null => {
  const trimmed = dateTimeLocal.trim();
  if (!trimmed) return null;

  if (DATE_ONLY_INPUT_REGEX.test(trimmed)) {
    const parsedDate = new Date(`${trimmed}T12:00`);
    if (Number.isNaN(parsedDate.getTime())) return null;
    parsedDate.setMilliseconds(DATE_ONLY_MARKER_MS);
    return parsedDate.toISOString();
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setMilliseconds(0);
  return parsed.toISOString();
};

export const isDateOnlyIso = (isoString: string | null | undefined) => {
  if (!isoString) return false;
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getMilliseconds() === DATE_ONLY_MARKER_MS;
};
