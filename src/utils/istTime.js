/**
 * Shared IST (Asia/Kolkata) time helpers for Beta Mode components.
 */

export function getIstDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

export function getIstHour() {
  return getIstDate().getHours();
}

export function getIstClock() {
  const ist = getIstDate();
  return `${String(ist.getHours()).padStart(2, '0')}:${String(ist.getMinutes()).padStart(2, '0')}`;
}

