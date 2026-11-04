import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as db from './db.js';
import { RAMAS_BASE, SETTINGS_BASE } from '../data/seed.js';

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
export function useRama(id) {
  const { ramas, loading, error } = useRamas();
  return { rama: ramas.find((r) => r.id === id), loading, error };
}

export function useSettings() {
  const { items, loading } = useCollection('settings');
  return { settings: { ...SETTINGS_BASE, ...(items.find((i) => i.id === 'site') || {}) }, loading };
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
