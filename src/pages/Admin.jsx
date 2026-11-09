import { useEffect, useState } from 'react';
import { Inbox, Users, Settings, Trash2, Mail, Check, Reply, Send } from 'lucide-react';
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
  const [filter, setFilter] = useState(null);
  if (loading) return <Loading />;
  if (!items.length) return <Empty icon={Inbox} title="No hay mensajes" text="Los mensajes del formulario de contacto aparecerán aquí." />;
  const answered = (m) => (m.replies || []).length > 0;
  const pendingCount = items.filter((m) => !answered(m)).length;
  const active = filter || (pendingCount ? 'pending' : 'all');
  const list = items
    .filter((m) => (active === 'pending' ? !answered(m) : active === 'done' ? answered(m) : true))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const FILTERS = [['pending', 'Sin responder', pendingCount], ['done', 'Respondidos', items.length - pendingCount], ['all', 'Todos', items.length]];
  return (
    <>
      <div className="chips" role="group" aria-label="Filtrar mensajes" style={{ marginBottom: 18 }}>
        {FILTERS.map(([id, l, n]) => (
          <button key={id} className={`chip ${active === id ? 'active' : ''}`} onClick={() => setFilter(id)}>
            {l} <span className={`count ${id === 'pending' && n ? 'alert' : ''}`}>{n}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <Empty icon={Inbox} title={active === 'pending' ? '¡Todo respondido!' : 'No hay mensajes aquí'} />
      ) : (
        <div className="comm-list">{list.map((m) => <MessageCard key={m.id} m={m} />)}</div>
      )}
    </>
  );
}

const gmailUrl = (to, subject, body) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const mailtoUrl = (to, subject, body) =>
  `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

function MessageCard({ m }) {
  const { user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const replies = m.replies || [];
  const subject = `Re: ${m.reason || 'Tu mensaje'} - Grupo Scout Alcázar`;
  const me = user?.name || 'Administrador';

  const send = async (via) => {
    const reply = text.trim();
    if (!reply) return toast('Escribe tu respuesta primero', 'error');
    const quoted = (m.message || '').split('\n').map((l) => `> ${l}`).join('\n');
    const body = `${reply}\n\n---\nEl ${formatDate(m.createdAt)}, ${m.name} escribió:\n${quoted}`;
    // La pestaña de Gmail se abre antes de guardar para que el navegador no la bloquee.
    const win = via === 'gmail' ? window.open('about:blank', '_blank') : null;
    setBusy(true);
    try {
      await db.save('messages', { ...m, read: true, replies: [...replies, { text: reply, by: me, at: new Date().toISOString() }] });
      const url = via === 'gmail' ? gmailUrl(m.email, subject, body) : mailtoUrl(m.email, subject, body);
      if (win) win.location.href = url;
      else window.location.href = url;
      toast('Respuesta guardada. Revisa que se haya enviado desde tu correo.');
      setText('');
      setOpen(false);
    } catch (e) {
      if (win) win.close();
      toast(e.message || 'No se pudo guardar la respuesta', 'error');
    } finally {
      setBusy(false);
    }
  };

  const markDone = () =>
    db.save('messages', { ...m, read: true, replies: [{ text: '(Respondido por otro medio)', by: me, at: new Date().toISOString() }] });

  const del = async () => {
    if (!window.confirm('¿Eliminar este mensaje y sus respuestas?')) return;
    await db.remove('messages', m.id);
    toast('Mensaje eliminado');
  };

  return (
    <article className={`card comm ${replies.length ? 'answered' : 'unread'}`}>
      <div className="comm-head">
        <div className="tags">
          <span className="tag tag-navy">{m.reason}</span>
          {replies.length ? <span className="tag tag-done"><Check size={12} /> Respondido</span> : <span className="tag tag-new">Sin responder</span>}
        </div>
        <time className="muted">{formatDate(m.createdAt)}</time>
      </div>
      <h3>{m.name}</h3>
      <p className="muted">{m.email}{m.phone && ` · ${m.phone}`}</p>
      <p className="pre">{m.message}</p>

      {replies.length > 0 && (
        <div className="replies">
          {replies.map((r, i) => (
            <div key={i} className="reply">
              <small><Reply size={13} /> Respondido por <b>{r.by}</b> · {new Date(r.at).toLocaleString('es-CL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</small>
              <p className="pre">{r.text}</p>
            </div>
          ))}
        </div>
      )}

      {open ? (
        <div className="reply-box">
          <Field label={`Tu respuesta para ${m.name}`} full>
            <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} autoFocus placeholder="Hola, gracias por escribirnos..." />
          </Field>
          <p className="hint">Al enviar, la respuesta se guarda aquí y se abre tu correo con todo listo: solo tienes que pulsar Enviar.</p>
          <div className="row-gap">
            <button className="btn btn-sm btn-primary" disabled={busy || !text.trim()} onClick={() => send('gmail')}><Send size={15} /> Enviar con Gmail</button>
            <button className="btn btn-sm btn-outline" disabled={busy || !text.trim()} onClick={() => send('mailto')}><Mail size={15} /> Otro programa de correo</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="admin-row">
          <button className="btn btn-sm btn-secondary" onClick={() => setOpen(true)}><Reply size={15} /> {replies.length ? 'Responder de nuevo' : 'Responder'}</button>
          {!replies.length && <button className="btn btn-sm btn-outline" onClick={markDone}><Check size={15} /> Ya lo respondí por otro medio</button>}
          <button className="btn btn-sm btn-danger-ghost" onClick={del}><Trash2 size={15} /> Eliminar</button>
        </div>
      )}
    </article>
  );
}

function UsersPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState(null);
  const toast = useToast();
  const load = () => db.auth.listUsers().then(setUsers).catch((e) => { toast(e.message, 'error'); setUsers([]); });
  useEffect(() => { load(); }, []);
  const [group, setGroup] = useState(null);
  const [q, setQ] = useState('');
  if (!users) return <Loading />;
  if (!users.length) return <Empty icon={Users} title="No hay usuarios" />;

  const GROUPS = [
    { id: 'pending', label: 'Pendientes', hint: 'Cuentas nuevas que esperan tu aprobación. Aún no ven nada privado.' },
    { id: 'member', label: 'Miembros', hint: 'Pueden ver Fotos, Eventos, Comunicaciones y Equipo.' },
    { id: 'admin', label: 'Administradores', hint: 'Además pueden crear, editar y eliminar contenido.' },
  ];
  const count = (r) => users.filter((u) => u.role === r).length;
  // Por defecto se abre "Pendientes" si hay alguno; si no, "Miembros".
  const active = group || (count('pending') ? 'pending' : 'member');
  const term = q.trim().toLowerCase();
  const list = users
    .filter((u) => (term ? true : u.role === active))
    .filter((u) => !term || `${u.name} ${u.email}`.toLowerCase().includes(term))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const change = async (u, role, msg) => {
    if (role === 'admin' && !window.confirm(`¿Dar permisos de administrador a ${u.name}? Podrá editar y borrar todo el contenido.`)) return;
    if (u.role === 'admin' && role !== 'admin' && !window.confirm(`¿Quitarle los permisos de administrador a ${u.name}?`)) return;
    try { await db.auth.setRole(u.id, role); toast(msg); load(); } catch (e) { toast(e.message, 'error'); }
  };
  const removeUser = async (u) => {
    if (!window.confirm(`¿Eliminar la cuenta de ${u.name} (${u.email})?\n\nSe borra por completo y no se puede deshacer. Si la persona vuelve a registrarse, aparecerá de nuevo en Pendientes.`)) return;
    try { await db.auth.deleteUser(u.id); toast(`Cuenta de ${u.name} eliminada`); load(); } catch (e) { toast(e.message, 'error'); }
  };
  const label = { pending: 'Pendiente', member: 'Miembro', admin: 'Administrador' };

  return (
    <div className="users-panel">
      <div className="toolbar">
        <div className="chips" role="group" aria-label="Tipo de cuenta">
          {GROUPS.map((g) => (
            <button key={g.id} className={`chip ${!term && active === g.id ? 'active' : ''}`} onClick={() => { setGroup(g.id); setQ(''); }}>
              {g.label} <span className={`count ${g.id === 'pending' && count('pending') ? 'alert' : ''}`}>{count(g.id)}</span>
            </button>
          ))}
        </div>
        <input className="search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o correo…" aria-label="Buscar usuario" />
      </div>
      <p className="muted small">{term ? `Resultados de "${q.trim()}" en todas las cuentas.` : GROUPS.find((g) => g.id === active).hint}</p>

      {list.length === 0 ? (
        <Empty icon={Users} title={term ? 'No se encontró a nadie' : active === 'pending' ? 'No hay cuentas pendientes' : 'No hay cuentas en este grupo'} />
      ) : (
        <ul className="user-list">
          {list.map((u) => {
            const me = u.id === user.id;
            return (
              <li key={u.id} className="card user-row">
                <span className="user-avatar">{(u.name || u.email || '?').trim()[0].toUpperCase()}</span>
                <div className="user-info">
                  <strong>{u.name}{me && ' (tú)'}</strong>
                  <small>{u.email}</small>
                  {term && <span className={`role-pill role-${u.role}`}>{label[u.role]}</span>}
                </div>
                {!me && (
                  <div className="user-actions">
                    {u.role === 'pending' && <button className="btn btn-sm btn-primary" onClick={() => change(u, 'member', `${u.name} ahora es miembro`)}><Check size={15} /> Aprobar</button>}
                    {u.role !== 'admin' && <button className="btn btn-sm btn-outline" onClick={() => change(u, 'admin', `${u.name} ahora es administrador`)}>Hacer admin</button>}
                    {u.role === 'admin' && <button className="btn btn-sm btn-outline" onClick={() => change(u, 'member', `${u.name} ahora es miembro`)}>Quitar admin</button>}
                    {u.role === 'member' && <button className="btn btn-sm btn-danger-ghost" onClick={() => change(u, 'pending', `${u.name} ya no tiene acceso`)}>Quitar acceso</button>}
                    {u.role === 'pending' && <button className="btn btn-sm btn-danger-ghost" onClick={() => removeUser(u)}><Trash2 size={15} /> Eliminar</button>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
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
