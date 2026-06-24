import { useEffect, useState } from 'react';
import { Icon } from './icons';

const DAY_PL = ['Niedz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
const MONTH_PL = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];

/** Clock + date. Collapses to a clock icon with the time only. */
export function TimeWidget({ expanded }: { expanded: boolean }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const dateStr = `${DAY_PL[now.getDay()]}, ${now.getDate()} ${MONTH_PL[now.getMonth()]}`;
  const time = `${hh}:${mm}`;

  return (
    <div className="sb-time" title={expanded ? undefined : `${time} · ${dateStr}`}>
      <span className="sb-time-ic"><Icon name="clock" size={18} /></span>
      <span className="sb-time-text">
        <strong>{time}</strong>
        <small>{dateStr}</small>
      </span>
      {!expanded && <span className="sb-tooltip" role="tooltip">{time} · {dateStr}</span>}
    </div>
  );
}
