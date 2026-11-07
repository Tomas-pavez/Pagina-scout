// Capa de datos con dos modos:
//  - "local": IndexedDB en el navegador (sin configuración, ideal para probar).
//  - "supabase": base de datos compartida, si existen VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
// Cada registro se guarda de forma individual (colección + id), así editar uno nunca toca a los demás.

import { createClient } from '@supabase/supabase-js';
import { FAQS_BASE, SETTINGS_BASE } from '../data/seed.js';

const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const MODE = SB_URL && SB_KEY ? 'supabase' : 'local';
// flowType 'pkce': al volver de Google llega "?code=..." en vez de tokens en el "#",
// así no choca con las rutas de la página (que usan "#/...").
const sb = MODE === 'supabase' ? createClient(SB_URL, SB_KEY, { auth: { flowType: 'pkce' } }) : null;
export const GOOGLE_ENABLED = MODE === 'supabase';

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

/* ---------- Suscripciones a cambios ---------- */
const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const emit = (col) => listeners.forEach((fn) => fn(col));

/* ---------- IndexedDB (modo local) ---------- */
let dbPromise;
function idb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open('scout-alcazar', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('records', { keyPath: 'key' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}
async function tx(mode, fn) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const t = db.transaction('records', mode);
    const store = t.objectStore('records');
    const req = fn(store);
    t.oncomplete = () => resolve(req && req.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('Operación cancelada (¿espacio insuficiente?)'));
  });
}
const lKey = (col, id) => `${col}:${id}`;
const local = {
  async list(col) {
    const rows = await tx('readonly', (s) => s.getAll(IDBKeyRange.bound(`${col}:`, `${col}:￿`)));
    return (rows || []).map((r) => r.data);
  },
  async get(col, id) {
    const row = await tx('readonly', (s) => s.get(lKey(col, id)));
    return row ? row.data : null;
  },
  async put(col, data) {
    await tx('readwrite', (s) => s.put({ key: lKey(col, data.id), col, data }));
  },
  async remove(col, id) {
    await tx('readwrite', (s) => s.delete(lKey(col, id)));
  },
};

let seeded;
function ensureSeed() {
  if (MODE !== 'local') return Promise.resolve();
  if (!seeded) {
    seeded = (async () => {
      if (localStorage.getItem('seeded-v1')) return;
      const faqs = await local.list('faqs');
      if (!faqs.length) for (const f of FAQS_BASE) await local.put('faqs', { id: uid(), ...f });
      if (!(await local.get('settings', 'site'))) await local.put('settings', { ...SETTINGS_BASE });
      localStorage.setItem('seeded-v1', '1');
    })();
  }
  return seeded;
}

/* ---------- API pública ---------- */
export async function list(col) {
  await ensureSeed();
  if (MODE === 'local') return local.list(col);
  const { data, error } = await sb.from('records').select('id,data').eq('collection', col);
  if (error) throw error;
  return data.map((r) => ({ ...r.data, id: r.id }));
}

export async function get(col, id) {
  await ensureSeed();
  if (MODE === 'local') return local.get(col, id);
  const { data, error } = await sb.from('records').select('id,data').eq('collection', col).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? { ...data.data, id: data.id } : null;
}

/** Crea o actualiza UN registro. Si no tiene id, se le asigna uno nuevo. */
export async function save(col, record) {
  const now = new Date().toISOString();
  const data = { ...record, id: record.id || uid(), updatedAt: now, createdAt: record.createdAt || now };
  if (MODE === 'local') await local.put(col, data);
  else {
    const row = { collection: col, id: data.id, data, updated_at: now };
    // Registros nuevos: insert simple (permite que visitantes envíen mensajes de contacto).
    const { error } = record.id
      ? await sb.from('records').upsert(row, { onConflict: 'collection,id' })
      : await sb.from('records').insert(row);
    if (error) throw error;
  }
  emit(col);
  return data;
}

/** Guarda parcialmente: lee el registro actual y mezcla solo los campos indicados. */
export async function patch(col, id, fields, base = {}) {
  const current = (await get(col, id)) || { ...base, id };
  return save(col, { ...current, ...fields, id });
}

export async function remove(col, id) {
  if (MODE === 'local') await local.remove(col, id);
  else {
    const { error } = await sb.from('records').delete().eq('collection', col).eq('id', id);
    if (error) throw error;
  }
  emit(col);
}

/* ---------- Archivos e imágenes ---------- */
function readAsDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Reduce una imagen a maxDim px (lado mayor) y la convierte a JPEG/WebP. */
export async function resizeImage(file, maxDim = 1600, quality = 0.82) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('No se pudo leer la imagen'));
      i.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    return blob || file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Sube un archivo y devuelve una URL utilizable en <img> o <a href>. */
export async function upload(file, { folder = 'general', maxDim = 1600 } = {}) {
  const isImage = file.type.startsWith('image/');
  const blob = isImage ? await resizeImage(file, maxDim) : file;
  if (MODE === 'local') {
    if (blob.size > 8 * 1024 * 1024) throw new Error('El archivo supera 8 MB, que es el máximo en modo local.');
    return readAsDataURL(blob);
  }
  const ext = isImage && blob !== file ? 'jpg' : (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${folder}/${uid()}.${ext}`;
  const { error } = await sb.storage.from('media').upload(path, blob, { contentType: blob.type || file.type });
  if (error) throw error;
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}

/* ---------- Autenticación ---------- */
// Roles: "admin" (gestiona todo), "member" (ve áreas privadas), "pending" (espera aprobación).
const authListeners = new Set();
export function onAuth(fn) {
  authListeners.add(fn);
  return () => authListeners.delete(fn);
}
const emitAuth = (u) => authListeners.forEach((fn) => fn(u));

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const publicUser = (u) => u && { id: u.id, name: u.name, email: u.email, role: u.role };

async function sbProfile(user) {
  if (!user) return null;
  const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return { id: user.id, email: user.email, name: data?.name || user.user_metadata?.name || user.email, role: data?.role || 'pending' };
}

export const auth = {
  async current() {
    if (MODE === 'local') {
      const id = localStorage.getItem('session-user');
      return id ? publicUser(await local.get('_users', id)) : null;
    }
    const { data } = await sb.auth.getSession();
    return sbProfile(data.session?.user);
  },
  async login(email, password) {
    email = email.trim().toLowerCase();
    if (MODE === 'local') {
      const users = await local.list('_users');
      const u = users.find((x) => x.email === email);
      if (!u || u.hash !== (await sha256(email + ':' + password))) throw new Error('Correo o contraseña incorrectos.');
      localStorage.setItem('session-user', u.id);
      emitAuth(publicUser(u));
      return publicUser(u);
    }
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Correo o contraseña incorrectos.');
    const p = await sbProfile(data.user);
    emitAuth(p);
    return p;
  },
  async register(name, email, password) {
    email = email.trim().toLowerCase();
    if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
    if (MODE === 'local') {
      const users = await local.list('_users');
      if (users.some((x) => x.email === email)) throw new Error('Ya existe una cuenta con ese correo.');
      // La primera cuenta creada en este navegador queda como administradora.
      const u = { id: uid(), name: name.trim(), email, role: users.length ? 'pending' : 'admin', hash: await sha256(email + ':' + password), createdAt: new Date().toISOString() };
      await local.put('_users', u);
      localStorage.setItem('session-user', u.id);
      emitAuth(publicUser(u));
      return publicUser(u);
    }
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name: name.trim() } } });
    if (error) throw new Error(error.message);
    const p = data.session ? await sbProfile(data.user) : null;
    emitAuth(p);
    return p;
  },
  /** Inicia sesión con Google (solo con Supabase). Redirige a Google y vuelve a esta misma página. */
  async loginWithGoogle() {
    if (MODE !== 'supabase') throw new Error('El inicio con Google requiere conectar Supabase.');
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) throw new Error(error.message);
  },
  async logout() {
    if (MODE === 'local') localStorage.removeItem('session-user');
    else await sb.auth.signOut();
    emitAuth(null);
  },
  async listUsers() {
    if (MODE === 'local') return (await local.list('_users')).map(publicUser);
    const { data, error } = await sb.from('profiles').select('*').order('created_at');
    if (error) throw error;
    return data;
  },
  async setRole(id, role) {
    if (MODE === 'local') {
      const u = await local.get('_users', id);
      await local.put('_users', { ...u, role });
    } else {
      const { error } = await sb.from('profiles').update({ role }).eq('id', id);
      if (error) throw error;
    }
  },
};

if (sb) {
  sb.auth.onAuthStateChange(async (_e, session) => emitAuth(await sbProfile(session?.user)));
}
