export const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const toChicagoDate = (date = new Date()) =>
  new Date(date.toLocaleString("en-US", { timeZone: "America/Chicago" }));

export const startOfWeekMondayChicago = (date = new Date()) => {
  const chicago = toChicagoDate(date);
  const day = chicago.getDay();
  const diff = (day + 6) % 7;
  chicago.setHours(0, 0, 0, 0);
  chicago.setDate(chicago.getDate() - diff);
  return toDateInputValue(chicago);
};

export const shiftWeek = (weekStart: string, weeks: number) => {
  const d = new Date(`${weekStart}T00:00:00`);
  d.setDate(d.getDate() + weeks * 7);
  return toDateInputValue(d);
};

export const formatWeekLabel = (weekStart: string) => {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} - ${fmt(end)}`;
};
