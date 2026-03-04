const DAY_MS = 1000 * 60 * 60 * 24;

export function dayOfYearFromDate(dateString: string): number | null {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const yearStart = new Date(Date.UTC(year, 0, 1));
  const diff = date.getTime() - yearStart.getTime();

  return Math.floor(diff / DAY_MS) + 1;
}

export function dateFromDayOfYear(doy: number, year: number): string | null {
  if (!Number.isInteger(doy) || doy < 1 || doy > 366) {
    return null;
  }

  const date = new Date(Date.UTC(year, 0, doy));
  if (date.getUTCFullYear() !== year) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}
