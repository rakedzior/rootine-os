import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useWeather } from '@/features/weather/useWeather';
import { WeatherButton, WeatherModal } from '@/features/weather/WeatherWidget';
import { UserMenu } from './UserMenu';

const NAV_ITEMS = [
  { to: '/', label: 'Planer', exact: true },
  { to: '/sport', label: 'Sport' },
  { to: '/diet', label: 'Dieta' },
  { to: '/finance', label: 'Finanse' },
  { to: '/goals', label: 'Cele' },
  { to: '/office', label: 'Biuro' },
  { to: '/travel', label: 'Podróże' },
  { to: '/notes', label: 'Notatki' },
  { to: '/work', label: 'Praca' },
];

const DAY_PL = ['Niedz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
const MONTH_PL = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];

export function Topbar() {
  const [now, setNow] = useState(new Date());
  const [weatherOpen, setWeatherOpen] = useState(false);
  const weather = useWeather();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const ss = now.getSeconds().toString().padStart(2, '0');
  const dateStr = `${DAY_PL[now.getDay()]}, ${now.getDate()} ${MONTH_PL[now.getMonth()]}`;

  return (
    <header className="topbar">
      {/* Brand */}
      <div className="brand">
        <div className="dot" />
        <span className="wm"><b>Rootine</b> <span>OS</span></span>
      </div>

      {/* Nav */}
      <nav className="nav">
        {NAV_ITEMS.map(({ to, label, exact }) => (
          <NavLink key={to} to={to} end={exact} className={({ isActive }) => isActive ? 'active' : undefined}>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="spacer" />

      {/* Right cluster */}
      <div className="tcluster">
        <WeatherButton weather={weather.data} loading={weather.loading} onClick={() => setWeatherOpen(true)} compact />
        <div className="tdiv" />
        <div className="tclock-col">
          <div className="tclock">{hh}:{mm}<span className="s">:{ss}</span></div>
          <div className="tclock-date">{dateStr}</div>
        </div>
        <div className="tdiv" />
        <UserMenu />
      </div>
      <WeatherModal
        open={weatherOpen}
        weather={weather.data}
        loading={weather.loading}
        error={weather.error}
        onClose={() => setWeatherOpen(false)}
        onSearch={weather.search}
      />
    </header>
  );
}
