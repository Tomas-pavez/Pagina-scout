import { useState } from 'react';
import { Plus, Megaphone, Download, ExternalLink, Pencil, Trash2, Upload, Loader2, FileText } from 'lucide-react';
import { Empty, Field, Loading, Modal, PageHero, SmartLink } from '../components/ui.jsx';
import { unitColor, unitLabel } from '../components/Shared.jsx';
import { COMM_TYPES } from '../data/seed.js';
import { formatDate, todayISO, useAuth, useCollection, useRamas, useToast } from '../lib/hooks.jsx';
import * as db from '../lib/db.js';

const typeLabel = (t) => COMM_TYPES.find((x) => x.id === t)?.label || 'Comunicado';

export default function Comms() {
  const { isAdmin } = useAuth();
  const { ramas } = useRamas();
  const { items, loading, error } = useCollection('comms');
  const [filter, setFilter] = useState('todas');
  const [type, setType] = useState('todos');
  const [editing, setEditing] = useState(null);
  const toast = useToast();

  const list = items
    .filter((c) => isAdmin || c.status === 'published')
    .filter((c) => filter === 'todas' || c.rama === filter || c.rama === 'all')
    .filter((c) => type === 'todos' || c.type === type)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const del = async (c) => {
    if (!window.confirm(`¿Eliminar "${c.title}"?`)) return;
    try { await db.remove('comms', c.id); await db.deleteFile(c.fileUrl); toast('Comunicación eliminada'); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <PageHero tk="comunicaciones.cabecera" eyebrow="Área privada" title="Comunicaciones" subtitle="Comunicados, noticias, autorizaciones, circulares y avisos para las familias." />
      <section className="section">
        <div className="container">
          <div className="toolbar">
            <div className="chips" role="group" aria-label="Filtrar por rama">
              <button className={`chip ${filter === 'todas' ? 'active' : ''}`} onClick={() => setFilter('todas')}>Todas</button>
              {ramas.map((r) => (
                <button key={r.id} className={`chip ${filter === r.id ? 'active' : ''}`} style={{ '--rama': r.color }} onClick={() => setFilter(r.id)}>{r.name}</button>
              ))}
            </div>
            <div className="row-gap">
              <select className="select-sm" value={type} onChange={(e) => setType(e.target.value)} aria-label="Filtrar por tipo">
                <option value="todos">Todos los tipos</option>
                {COMM_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              {isAdmin && <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> Nueva comunicación</button>}
            </div>
          </div>

          {loading ? <Loading /> : error ? <Empty title="No se pudieron cargar las comunicaciones" text={error} /> : list.length === 0 ? (
            <Empty icon={Megaphone} title="No hay comunicaciones" text="Cuando el grupo publique comunicados aparecerán aquí." />
          ) : (
            <div className="comm-list">
              {list.map((c) => (
                <article key={c.id} className="card comm reveal" style={{ '--rama': unitColor(ramas, c.rama) }}>
                  <div className="comm-head">
                    <div className="tags">
                      <span className="tag" style={{ background: unitColor(ramas, c.rama) }}>{unitLabel(ramas, c.rama)}</span>
                      <span className="tag tag-soft">{typeLabel(c.type)}</span>
                      {c.status === 'draft' && <span className="tag tag-draft">Borrador</span>}
                    </div>
                    <time className="muted">{formatDate(c.date)}</time>
                  </div>
                  <h3>{c.title}</h3>
                  {c.description && <p className="pre">{c.description}</p>}
                  <div className="row-gap">
                    {c.fileUrl && (
                      <SmartLink className="btn btn-sm btn-secondary" href={c.fileUrl} download={c.fileName || true} target="_blank" rel="noreferrer"><Download size={15} /> {c.fileName || 'Descargar archivo'}</SmartLink>
                    )}
                    {c.link && <a className="btn btn-sm btn-outline" href={c.link} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Abrir enlace</a>}
                  </div>
                  {isAdmin && (
                    <div className="admin-row">
                      <button className="btn btn-sm btn-outline" onClick={() => setEditing(c)}><Pencil size={15} /> Editar</button>
                      <button className="btn btn-sm btn-danger-ghost" onClick={() => del(c)}><Trash2 size={15} /> Eliminar</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      {editing && <CommForm initial={editing} ramas={ramas} onClose={() => setEditing(null)} />}
    </>
  );
}

function CommForm({ initial, ramas, onClose }) {
  const [f, setF] = useState({ title: '', date: todayISO(), type: 'comunicado', description: '', rama: 'all', fileUrl: '', fileName: '', link: '', status: 'draft', ...initial });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await db.upload(file, { folder: 'comunicaciones', maxDim: 2200, private: true });
      setF((x) => ({ ...x, fileUrl: url, fileName: file.name }));
    } catch (e) { toast(e.message, 'error'); } finally { setUploading(false); }
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) return toast('El título es obligatorio', 'error');
    setSaving(true);
    try {
      await db.save('comms', { ...f, title: f.title.trim(), link: f.link.trim() });
      toast(f.status === 'published' ? 'Comunicación publicada' : 'Borrador guardado');
      onClose();
    } catch (err) { toast(err.message, 'error'); } finally { setSaving(false); }
  };
  return (
    <Modal title={initial.id ? 'Editar comunicación' : 'Nueva comunicación'} onClose={onClose} wide>
      <form className="form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Título" required full><input required value={f.title} onChange={set('title')} /></Field>
          <Field label="Fecha"><input type="date" value={f.date} onChange={set('date')} /></Field>
          <Field label="Tipo">
            <select value={f.type} onChange={set('type')}>{COMM_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
          </Field>
          <Field label="Destinatarios">
            <select value={f.rama} onChange={set('rama')}>
              <option value="all">Todo el grupo</option>
              {ramas.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <select value={f.status} onChange={set('status')}>
              <option value="draft">Borrador (solo administradores)</option>
              <option value="published">Publicado</option>
            </select>
          </Field>
          <Field label="Descripción" full><textarea rows={5} value={f.description} onChange={set('description')} /></Field>
          <div className="field full">
            <span className="field-label">Archivo descargable</span>
            <div className="row-gap">
              <label className="btn btn-sm btn-outline">
                {uploading ? <Loader2 className="spin" size={15} /> : <Upload size={15} />} {f.fileUrl ? 'Reemplazar archivo' : 'Subir archivo'}
                <input type="file" hidden onChange={(e) => uploadFile(e.target.files[0])} />
              </label>
              {f.fileUrl && (
                <>
                  <span className="file-pill"><FileText size={14} /> {f.fileName || 'Archivo'}</span>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setF((x) => ({ ...x, fileUrl: '', fileName: '' }))}>Quitar</button>
                </>
              )}
            </div>
          </div>
          <Field label="Enlace externo" full><input type="url" value={f.link} onChange={set('link')} placeholder="https://…" /></Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={saving || uploading}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}
