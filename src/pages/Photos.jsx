import { useState } from 'react';
import { Plus, Images } from 'lucide-react';
import { Empty, Field, ImageInput, Loading, Modal, PageHero } from '../components/ui.jsx';
import { AlbumCard } from '../components/Shared.jsx';
import { todayISO, useAuth, useCollection, useRamas, useToast } from '../lib/hooks.jsx';
import * as db from '../lib/db.js';

export default function Photos() {
  const { isAdmin } = useAuth();
  const { ramas } = useRamas();
  const albums = useCollection('albums');
  const photos = useCollection('photos');
  const [filter, setFilter] = useState('todas');
  const [editing, setEditing] = useState(null);

  const counts = {};
  photos.items.forEach((p) => (counts[p.albumId] = (counts[p.albumId] || 0) + 1));
  const list = albums.items
    .filter((a) => filter === 'todas' || a.rama === filter)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const years = [...new Set(list.map((a) => (a.date || '').slice(0, 4) || 'Sin fecha'))];

  return (
    <>
      <PageHero eyebrow="Galería privada" title="Fotos y álbumes" subtitle="Los mejores momentos del grupo, ordenados por año." />
      <section className="section">
        <div className="container">
          <div className="toolbar">
            <div className="chips" role="group" aria-label="Filtrar por rama">
              <button className={`chip ${filter === 'todas' ? 'active' : ''}`} onClick={() => setFilter('todas')}>Todas</button>
              <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todo el grupo</button>
              {ramas.map((r) => (
                <button key={r.id} className={`chip ${filter === r.id ? 'active' : ''}`} style={{ '--rama': r.color }} onClick={() => setFilter(r.id)}>{r.name}</button>
              ))}
            </div>
            {isAdmin && <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> Nuevo álbum</button>}
          </div>
          {albums.loading ? <Loading /> : albums.error ? <Empty title="No se pudieron cargar los álbumes" text={albums.error} /> : list.length === 0 ? (
            <Empty icon={Images} title="Todavía no hay álbumes" text={isAdmin ? 'Crea el primer álbum y sube sus fotos.' : 'Pronto compartiremos fotos de nuestras actividades.'} />
          ) : (
            years.map((y) => (
              <div key={y} className="year-group">
                <h2 className="year-title">{y}</h2>
                <div className="grid-4">
                  {list.filter((a) => ((a.date || '').slice(0, 4) || 'Sin fecha') === y).map((a) => (
                    <AlbumCard key={a.id} album={a} ramas={ramas} count={counts[a.id] || 0} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      {editing && <AlbumForm initial={editing} ramas={ramas} onClose={() => setEditing(null)} />}
    </>
  );
}

export function AlbumForm({ initial, ramas, onClose, onSaved }) {
  const [f, setF] = useState({ title: '', date: todayISO(), description: '', cover: '', rama: 'all', ...initial });
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));
  const submit = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) return toast('El título es obligatorio', 'error');
    setSaving(true);
    try {
      const saved = await db.save('albums', { ...f, title: f.title.trim() });
      toast(initial.id ? 'Álbum actualizado' : 'Álbum creado');
      onSaved?.(saved);
      onClose();
    } catch (err) { toast(err.message, 'error'); } finally { setSaving(false); }
  };
  return (
    <Modal title={initial.id ? 'Editar álbum' : 'Nuevo álbum'} onClose={onClose} wide>
      <form className="form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Título" required full><input required value={f.title} onChange={set('title')} /></Field>
          <Field label="Fecha"><input type="date" value={f.date} onChange={set('date')} /></Field>
          <Field label="Rama asociada">
            <select value={f.rama} onChange={set('rama')}>
              <option value="all">Todo el grupo</option>
              {ramas.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Descripción" full><textarea rows={3} value={f.description} onChange={set('description')} /></Field>
          <div className="full"><ImageInput label="Portada" value={f.cover} onChange={set('cover')} folder="albumes/portadas" private /></div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar álbum'}</button>
        </div>
      </form>
    </Modal>
  );
}
