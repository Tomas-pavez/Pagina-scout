import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Images, Pencil, Trash2, UploadCloud, Star, X, Loader2, Check } from 'lucide-react';
import { Empty, Loading, SmartImg } from '../components/ui.jsx';
import { unitColor, unitLabel } from '../components/Shared.jsx';
import { AlbumForm } from './Photos.jsx';
import { formatDate, useAuth, useCollection, useRamas, useToast } from '../lib/hooks.jsx';
import * as db from '../lib/db.js';

export default function AlbumDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isAdmin } = useAuth();
  const { ramas } = useRamas();
  const albums = useCollection('albums');
  const photosQ = useCollection('photos');
  const [editing, setEditing] = useState(false);
  const [lightbox, setLightbox] = useState(-1);
  const toast = useToast();

  const album = albums.items.find((a) => a.id === id);
  const photos = photosQ.items
    .filter((p) => p.albumId === id)
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

  if (albums.loading) return <div className="container section"><Loading /></div>;
  if (!album)
    return (
      <div className="container section">
        <Empty icon={Images} title="Álbum no encontrado"><Link className="btn btn-primary" to="/fotos">Volver a la galería</Link></Empty>
      </div>
    );

  const deleteAlbum = async () => {
    if (!window.confirm(`¿Eliminar el álbum "${album.title}" y sus ${photos.length} fotos?`)) return;
    try {
      for (const p of photos) { await db.remove('photos', p.id); await db.deleteFile(p.src); }
      if (album.cover && !photos.some((p) => p.src === album.cover)) await db.deleteFile(album.cover);
      await db.remove('albums', album.id);
      toast('Álbum eliminado');
      nav('/fotos');
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <section className="page-hero" style={{ '--accent': unitColor(ramas, album.rama) }}>
        <div className="container">
          <Link to="/fotos" className="back-link"><ArrowLeft size={18} /> Galería</Link>
          <span className="eyebrow">{formatDate(album.date)} · {unitLabel(ramas, album.rama)}</span>
          <h1>{album.title}</h1>
          {album.description && <p>{album.description}</p>}
          {isAdmin && (
            <div className="row-gap" style={{ marginTop: 16 }}>
              <button className="btn btn-light btn-sm" onClick={() => setEditing(true)}><Pencil size={15} /> Editar álbum</button>
              <button className="btn btn-outline-light btn-sm" onClick={deleteAlbum}><Trash2 size={15} /> Eliminar álbum</button>
            </div>
          )}
        </div>
      </section>
      <section className="section">
        <div className="container">
          {isAdmin && <PhotoUploader album={album} hasCover={!!album.cover} />}
          {photosQ.loading ? <Loading /> : photos.length === 0 ? (
            <Empty icon={Images} title="Este álbum aún no tiene fotos" text={isAdmin ? 'Arrastra tus fotos al recuadro de arriba o pulsa "Elegir fotos".' : undefined} />
          ) : (
            <>
              <p className="muted">{photos.length} {photos.length === 1 ? 'foto' : 'fotos'}</p>
              <div className="photo-grid">
                {photos.map((p, i) => (
                  <PhotoTile key={p.id} photo={p} album={album} isAdmin={isAdmin} onOpen={() => setLightbox(i)} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
      {editing && <AlbumForm initial={album} ramas={ramas} onClose={() => setEditing(false)} />}
      {lightbox >= 0 && photos[lightbox] && (
        <Lightbox photos={photos} index={lightbox} setIndex={setLightbox} onClose={() => setLightbox(-1)} />
      )}
    </>
  );
}

/** Zona para subir varias fotos a la vez (clic o arrastrar y soltar). Cada foto se guarda como un registro propio. */
function PhotoUploader({ album, hasCover }) {
  const [queue, setQueue] = useState([]); // {name, status: 'pending'|'ok'|'error', error}
  const [drag, setDrag] = useState(false);
  const busy = queue.some((q) => q.status === 'pending');
  const ref = useRef();
  const toast = useToast();

  const handle = async (fileList) => {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return toast('Selecciona archivos de imagen (JPG, PNG, WebP…).', 'error');
    const start = Date.now();
    setQueue(files.map((f) => ({ name: f.name, status: 'pending' })));
    let ok = 0;
    let coverSet = hasCover;
    for (let i = 0; i < files.length; i++) {
      try {
        const src = await db.upload(files[i], { folder: `albumes/${album.id}`, maxDim: 1920, private: true });
        // createdAt incremental para conservar el orden de subida
        await db.save('photos', { albumId: album.id, src, caption: '', createdAt: new Date(start + i).toISOString() });
        if (!coverSet) {
          await db.patch('albums', album.id, { cover: src });
          coverSet = true;
        }
        ok++;
        setQueue((q) => q.map((x, j) => (j === i ? { ...x, status: 'ok' } : x)));
      } catch (e) {
        setQueue((q) => q.map((x, j) => (j === i ? { ...x, status: 'error', error: e.message } : x)));
      }
    }
    toast(ok === files.length ? `${ok} ${ok === 1 ? 'foto subida' : 'fotos subidas'}` : `Se subieron ${ok} de ${files.length} fotos`, ok === files.length ? 'ok' : 'error');
    if (ref.current) ref.current.value = '';
    setTimeout(() => setQueue((q) => q.filter((x) => x.status === 'error')), 2500);
  };

  const done = queue.filter((q) => q.status !== 'pending').length;
  return (
    <div
      className={`uploader ${drag ? 'drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); if (!busy) handle(e.dataTransfer.files); }}
    >
      <UploadCloud size={36} />
      <div>
        <strong>Subir fotos a este álbum</strong>
        <p className="muted">Arrastra varias fotos aquí o elígelas desde tu dispositivo. Se optimizan automáticamente.</p>
      </div>
      <button type="button" className="btn btn-primary" onClick={() => ref.current.click()} disabled={busy}>
        {busy ? <><Loader2 className="spin" size={18} /> Subiendo {done}/{queue.length}</> : 'Elegir fotos'}
      </button>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => handle(e.target.files)} />
      {queue.length > 0 && (
        <div className="upload-progress">
          <div className="bar"><span style={{ width: `${(done / queue.length) * 100}%` }} /></div>
          <ul>
            {queue.map((q, i) => (
              <li key={i} className={q.status}>
                {q.status === 'pending' ? <Loader2 className="spin" size={14} /> : q.status === 'ok' ? <Check size={14} /> : <X size={14} />}
                {q.name}{q.error && ` — ${q.error}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PhotoTile({ photo, album, isAdmin, onOpen }) {
  const [caption, setCaption] = useState(photo.caption || '');
  const [editing, setEditing] = useState(false);
  const toast = useToast();
  useEffect(() => setCaption(photo.caption || ''), [photo.caption]);
  const isCover = album.cover === photo.src;

  const saveCaption = async (e) => {
    e.preventDefault();
    try {
      await db.save('photos', { ...photo, caption: caption.trim() });
      setEditing(false);
      toast('Descripción guardada');
    } catch (err) { toast(err.message, 'error'); }
  };
  const del = async () => {
    if (!window.confirm('¿Eliminar esta foto?')) return;
    try {
      await db.remove('photos', photo.id);
      await db.deleteFile(photo.src);
      if (isCover) await db.patch('albums', album.id, { cover: '' });
      toast('Foto eliminada');
    } catch (err) { toast(err.message, 'error'); }
  };
  const makeCover = async () => {
    try {
      await db.patch('albums', album.id, { cover: photo.src });
      toast('Portada actualizada');
    } catch (err) { toast(err.message, 'error'); }
  };

  return (
    <figure className="photo-tile">
      <button type="button" className="photo-open" onClick={onOpen} aria-label={`Ver foto ${photo.caption || ''}`}>
        <SmartImg src={photo.src} alt={photo.caption || `Foto de ${album.title}`} loading="lazy" />
      </button>
      {isCover && <span className="cover-badge"><Star size={12} /> Portada</span>}
      {editing ? (
        <form className="caption-form" onSubmit={saveCaption}>
          <input autoFocus value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Descripción de la foto" />
          <button className="icon-btn" aria-label="Guardar descripción"><Check size={16} /></button>
          <button type="button" className="icon-btn" aria-label="Cancelar" onClick={() => { setEditing(false); setCaption(photo.caption || ''); }}><X size={16} /></button>
        </form>
      ) : photo.caption ? <figcaption>{photo.caption}</figcaption> : null}
      {isAdmin && !editing && (
        <div className="photo-actions">
          <button className="icon-btn" title="Editar descripción" aria-label="Editar descripción" onClick={() => setEditing(true)}><Pencil size={15} /></button>
          {!isCover && <button className="icon-btn" title="Usar como portada" aria-label="Usar como portada" onClick={makeCover}><Star size={15} /></button>}
          <button className="icon-btn danger" title="Eliminar foto" aria-label="Eliminar foto" onClick={del}><Trash2 size={15} /></button>
        </div>
      )}
    </figure>
  );
}

function Lightbox({ photos, index, setIndex, onClose }) {
  const prev = () => setIndex((index - 1 + photos.length) % photos.length);
  const next = () => setIndex((index + 1) % photos.length);
  useEffect(() => {
    const on = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', on);
    return () => document.removeEventListener('keydown', on);
  });
  const p = photos[index];
  return (
    <div className="lightbox" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true">
      <button className="icon-btn lb-close" onClick={onClose} aria-label="Cerrar"><X /></button>
      {photos.length > 1 && <button className="icon-btn lb-prev" onClick={prev} aria-label="Anterior"><ChevronLeft size={32} /></button>}
      <figure>
        <SmartImg src={p.src} alt={p.caption || 'Foto'} />
        <figcaption>{p.caption} <span className="muted">{index + 1} / {photos.length}</span></figcaption>
      </figure>
      {photos.length > 1 && <button className="icon-btn lb-next" onClick={next} aria-label="Siguiente"><ChevronRight size={32} /></button>}
    </div>
  );
}
