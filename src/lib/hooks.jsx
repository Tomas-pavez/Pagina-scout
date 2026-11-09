import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as db from './db.js';
import { PATRULLAS_BASE, RAMAS_BASE, SETTINGS_BASE } from '../data/seed.js';

/* ---------- Sesión ---------- */
const AuthCtx = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    db.auth.current().then((u) => { setUser(u); setReady(true); }).catch(() => setReady(true));
    return db.onAuth(setUser);
  }, []);
  const value = {
    user,
    ready,
    isMember: !!user && (user.role === 'member' || user.role === 'admin'),
    isAdmin: user?.role === 'admin',
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);

/* ---------- Colecciones ---------- */
export function useCollection(col, { enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    try {
      setError(null);
      setItems(await db.list(col));
    } catch (e) {
      setError(e.message || 'No se pudo cargar la información.');
    } finally {
      setLoading(false);
    }
  }, [col, enabled]);
  useEffect(() => {
    setLoading(enabled);
    load();
    return db.subscribe((c) => c === col && load());
  }, [col, load, enabled]);
  return { items, loading, error, reload: load };
}

/** Ramas: datos base + lo que cada administrador haya editado (guardado por rama). */
export function useRamas() {
  const { items, loading, error } = useCollection('ramas');
  const ramas = RAMAS_BASE.map((base) => ({ ...base, ...(items.find((i) => i.id === base.id) || {}) }));
  return { ramas, loading, error };
}
/* ---------- Patrullas ----------
   Se guardan en la colección pública "ramas" con id "patrulla:<rama>:<clave>",
   cada una como registro propio. Las patrullas iniciales salen de PATRULLAS_BASE
   hasta que se editan; quitar una deja una marca "eliminada". */
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const patrullaId = (ramaId, key) => `patrulla:${ramaId}:${key}`;

export function usePatrullas(ramaId) {
  const { items, loading } = useCollection('ramas');
  const stored = items.filter((i) => i.kind === 'patrulla' && i.rama === ramaId);
  const base = (PATRULLAS_BASE[ramaId] || []).map((nombre, i) => ({
    id: patrullaId(ramaId, slug(nombre)), key: slug(nombre), kind: 'patrulla', rama: ramaId, nombre, order: i + 1,
    animal: '', grito: '', himno: '', descripcion: '', panolin: '', foto: '',
  }));
  const merged = base.map((b) => ({ ...b, ...(stored.find((s) => s.id === b.id) || {}) }));
  stored.forEach((s) => { if (!merged.some((m) => m.id === s.id)) merged.push(s); });
  const patrullas = merged.filter((p) => !p.deleted).sort((a, b) => (a.order || 0) - (b.order || 0));
  return { patrullas, loading, hasBase: ramaId in PATRULLAS_BASE };
}

export function useRama(id) {
  const { ramas, loading, error } = useRamas();
  return { rama: ramas.find((r) => r.id === id), loading, error };
}

/* ---------- Contenido editable (datos del sitio + textos) ----------
   Todo vive en la colección pública "settings":
   - "site": datos generales (logo, nombre, dirección, redes...).
   - "t:<clave>": un texto de la página. Cada texto es un registro propio,
     así editar uno nunca toca a los demás. */
const ContentCtx = createContext(null);
const EDIT_KEY = 'modo-edicion';

export function ContentProvider({ children }) {
  const { items, loading } = useCollection('settings');
  const [editMode, setEditModeState] = useState(() => {
    try { return localStorage.getItem(EDIT_KEY) === '1'; } catch { return false; }
  });
  const setEditMode = useCallback((v) => {
    setEditModeState(v);
    try { localStorage.setItem(EDIT_KEY, v ? '1' : '0'); } catch { /* sin almacenamiento */ }
  }, []);
  const site = { ...SETTINGS_BASE, ...(items.find((i) => i.id === 'site') || {}) };
  const texts = {};
  items.forEach((i) => { if (i.id.startsWith('t:') && typeof i.value === 'string') texts[i.id.slice(2)] = i.value; });
  return (
    <ContentCtx.Provider value={{ site, texts, loading, editMode, setEditMode }}>
      {children}
    </ContentCtx.Provider>
  );
}
export const useContent = () => useContext(ContentCtx);

export function useSettings() {
  const { site, loading } = useContent();
  return { settings: site, loading };
}

/** Guarda un texto editable (o lo borra para volver al texto original). */
export async function saveText(key, value) {
  if (value === null) return db.remove('settings', `t:${key}`);
  return db.save('settings', { id: `t:${key}`, value });
}

/* ---------- Avisos (toasts) ---------- */
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = 'ok') => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ---------- Utilidades de fecha ---------- */
export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export function formatDate(iso, opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CL', opts);
}
