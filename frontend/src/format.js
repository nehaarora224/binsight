const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = n => String(n).padStart(2, '0');

/** "09:42" */
export const clock = (d = new Date()) => {
  const t = new Date(d);
  return `${pad(t.getHours())}:${pad(t.getMinutes())}`;
};

/** "Mon, 28 Sep 2026" */
export const longDate = (d = new Date()) => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/** "28 Sep · 09:42 AM" */
export const reportTime = iso => {
  const d = new Date(iso);
  const h = d.getHours() % 12 || 12;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} · ${pad(h)}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
};

/** 200 → "3 h 20 min" */
export const duration = mins => (mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`);

/** "MIXED" → "Mixed" */
export const title = s => s.charAt(0) + s.slice(1).toLowerCase();

export const km = n => `${n.toFixed(1)} km`;

/** Whole calendar days covered by a list of timestamps, counting today. */
export const daysSpanned = isoList => {
  if (!isoList.length) return 0;
  const start = new Date(Math.min(...isoList.map(t => new Date(t))));
  start.setHours(0, 0, 0, 0);
  return Math.floor((Date.now() - start) / 86400000) + 1;
};
