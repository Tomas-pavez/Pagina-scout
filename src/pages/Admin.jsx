import { useEffect, useState } from 'react';
import { Inbox, Users, Settings, Trash2, Mail, Check } from 'lucide-react';
import { Empty, Field, ImageInput, Loading, PageHero } from '../components/ui.jsx';
import { formatDate, useAuth, useCollection, useSettings, useToast } from '../lib/hooks.jsx';
import * as db from '../lib/db.js';

export default function Admin() {
  const [tab, setTab] = useState('mensajes');
  return (
    <>
      <PageHero tk="admin.cabecera" eyebrow="Administración" title="Panel del grupo" subtitle="Mensajes de contacto, cuentas de usuario y datos generales del sitio." />
      <section className="section">
        <div className="container">
          <div className="tabs" role="tablist">
            {[['mensajes', 'Mensajes', Inbox], ['usuarios', 'Usuarios', Users], ['sitio', 'Datos del sitio', Settings]].map(([k, l, Icon]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}><Icon size={16} /> {l}</button>
            ))}
          </div>
          {tab === 'mensajes' && <Messages />}
          {tab === 'usuarios' && <UsersPanel />}
          {tab === 'sitio' && <SiteSettings />}
        </div>
      </section>
    </>
  );
}

function Messages() {
  const { items, loading } = useCollection('messages');
  const toast = useToast();
  const list = [...items].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  if (loading) return <Loading />;
  if (!list.length) return <Empty icon={Inbox} title="No hay mensajes" text="Los mensajes del formulario de contacto aparecerán aquí." />;
  return (
    <div className="comm-list">
      {list.map((m) => (
        <article key={m.id} className={`card comm ${m.read ? '' : 'unread'}`}>
          <div className="comm-head">
            <div className="tags"><span className="tag tag-navy">{m.reason}</span>{!m.read && <span className="tag tag-new">Nuevo</span>}</div>
            <time className="muted">{formatDate(m.createdAt)}</time>
          </div>
          <h3>{m.name}</h3>
          <p className="muted">{m.email}{m.phone && ` · ${m.phone}`}</p>
          <p className="pre">{m.message}</p>
          <div className="admin-row">
            <a className="btn btn-sm btn-secondary" href={`mailto:${m.email}?subject=${encodeURIComponent('Grupo Scout Alcázar: ' + m.reason)}`}><Mail size={15} /> Responder</a>
            {!m.read && <button className="btn btn-sm btn-outline" onClick={() => db.save('messages', { ...m, read: true })}><Check size={15} /> Marcar leído</button>}
            <button className="btn btn-sm btn-danger-ghost" onClick={async () => { if (window.confirm('¿Eliminar este mensaje?')) { await db.remove('messages', m.id); toast('Mensaje eliminado'); } }}><Trash2 size={15} /> Eliminar</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function UsersPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState(null);
  const toast = useToast();
  const load = () => db.auth.listUsers().then(setUsers).catch((e) => { toast(e.message, 'error'); setUsers([]); });
  useEffect(() => { load(); }, []);
  if (!users) return <Loading />;
  if (!users.length) return <Empty icon={Users} title="No hay usuarios" />;
  const change = async (u, role) => {
    try { await db.auth.setRole(u.id, role); toast('Rol actualizado'); load(); } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <div className="card table-card">
      <table className="table">
        <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <select value={u.role} onChange={(e) => change(u, e.target.value)} disabled={u.id === user.id} aria-label={`Rol de ${u.name}`}>
                  <option value="pending">Pendiente</option>
                  <option value="member">Miembro</option>
                  <option value="admin">Administrador</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">“Miembro” puede ver Fotos, Eventos, Comunicaciones y Equipo. “Administrador” además puede crear, editar y eliminar contenido.</p>
    </div>
  );
}

function SiteSettings() {
  const { settings, loading } = useSettings();
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  useEffect(() => { if (!loading && !f) setF(settings); }, [loading, settings, f]);
  if (!f) return <Loading />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await db.save('settings', { ...f, id: 'site' }); toast('Datos guardados'); } catch (err) { toast(err.message, 'error'); } finally { setSaving(false); }
  };
  return (
    <form className="card form form-card" onSubmit={submit}>
      <div className="form-grid">
        <div className="full">
          <ImageInput label="Logo del grupo (se ve en el menú, el pie de página y la pestaña del navegador)" value={f.logo || ''} onChange={(v) => setF({ ...f, logo: v })} folder="sitio" maxDim={512} keepPng />
          <p className="hint">Usa una imagen cuadrada, idealmente PNG con fondo transparente. Si la quitas, vuelve el logo original.</p>
        </div>
        <Field label="Dirección" full><input value={f.address} onChange={set('address')} /></Field>
        <Field label="Horario de actividades" full><input value={f.schedule} onChange={set('schedule')} /></Field>
        <Field label="Correo de contacto"><input type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Video (Quiénes Somos)"><input type="url" value={f.videoUrl} onChange={set('videoUrl')} placeholder="https://www.youtube.com/watch?v=..." /></Field>
        <Field label="Instagram"><input type="url" value={f.instagram} onChange={set('instagram')} /></Field>
        <Field label="Facebook"><input type="url" value={f.facebook} onChange={set('facebook')} /></Field>
      </div>
      <div className="form-actions"><button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button></div>
    </form>
  );
}
