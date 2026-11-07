import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, Mail, MapPin, Clock, ShieldCheck, UserPlus } from 'lucide-react';
import { Logo, Instagram, Facebook, T } from './ui.jsx';
import { useAuth, useRamas, useSettings } from '../lib/hooks.jsx';
import * as db from '../lib/db.js';

const PUBLIC_LINKS = [
  ['/', 'Inicio'],
  ['/quienes-somos', 'Quiénes Somos'],
  ['/ramas', 'Ramas'],
  ['/preguntas-frecuentes', 'Preguntas Frecuentes'],
  ['/contacto', 'Contacto'],
];
const PRIVATE_LINKS = [
  ['/fotos', 'Fotos'],
  ['/eventos', 'Eventos'],
  ['/comunicaciones', 'Comunicaciones'],
  ['/equipo', 'Equipo'],
];

export function Navbar() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const logout = async () => {
    await db.auth.logout();
    nav('/');
  };
  const links = [...PUBLIC_LINKS, ...(user ? PRIVATE_LINKS : []), ...(isAdmin ? [['/admin', 'Administración']] : [])];
  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <Link to="/" className="brand" aria-label="Grupo Scout Alcázar, inicio">
          <Logo size={42} />
          <span>
            <strong><T k="marca.nombre">Grupo Scout Alcázar</T></strong>
            <small><T k="marca.lugar">Las Condes · Santiago</T></small>
          </span>
        </Link>
        <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Principal">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {label === 'Administración' && <ShieldCheck size={15} />} {label}
            </NavLink>
          ))}
          <div className="nav-actions-mobile">
            {user ? (
              <button className="btn btn-outline btn-sm" onClick={logout}><LogOut size={16} /> Cerrar sesión</button>
            ) : (
              <Link className="btn btn-outline btn-sm" to="/ingresar"><LogIn size={16} /> Iniciar sesión</Link>
            )}
            <Link className="btn btn-primary btn-sm" to="/contacto?motivo=inscripcion"><UserPlus size={16} /> Únete</Link>
          </div>
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <span className="user-chip" title={user.email}>{user.name?.split(' ')[0]}</span>
              <button className="btn btn-ghost btn-sm" onClick={logout}><LogOut size={16} /> Salir</button>
            </>
          ) : (
            <Link className="btn btn-ghost btn-sm" to="/ingresar"><LogIn size={16} /> Ingresar</Link>
          )}
          <Link className="btn btn-primary btn-sm" to="/contacto?motivo=inscripcion">Únete</Link>
        </div>
        <button className="icon-btn menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? 'Cerrar menú' : 'Abrir menú'}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

export function Footer() {
  const { ramas } = useRamas();
  const { settings } = useSettings();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand brand-footer">
            <Logo size={48} />
            <span><strong><T k="marca.nombre">Grupo Scout Alcázar</T></strong><small><T k="pie.lugar">Las Condes · Santiago de Chile</T></small></span>
          </div>
          <p className="footer-text"><T k="pie.texto">Parte de la Asociación de Guías y Scouts de Chile. Formamos personas comprometidas con su comunidad a través del juego, la aventura y el servicio.</T></p>
          <p className="motto"><T k="pie.lema">“Siempre Listos”</T></p>
        </div>
        <div>
          <h4>Navegación</h4>
          <ul>{PUBLIC_LINKS.map(([to, l]) => <li key={to}><Link to={to}>{l}</Link></li>)}</ul>
        </div>
        <div>
          <h4>Ramas</h4>
          <ul>
            {ramas.map((r) => (
              <li key={r.id}><Link to={`/ramas/${r.id}`}><span className="dot" style={{ background: r.color }} />{r.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Contacto</h4>
          <ul className="footer-contact">
            <li><MapPin size={16} /> {settings.address}</li>
            <li><Clock size={16} /> {settings.schedule}</li>
            {settings.email && <li><Mail size={16} /> <a href={`mailto:${settings.email}`}>{settings.email}</a></li>}
          </ul>
          <div className="socials">
            {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram /></a>}
            {settings.facebook && <a href={settings.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook /></a>}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">© {new Date().getFullYear()} <T k="marca.nombre">Grupo Scout Alcázar</T> · <T k="pie.frase">Siempre Listos para Servir</T> · <a href="./privacidad.html">Política de privacidad</a></div>
      </div>
    </footer>
  );
}
