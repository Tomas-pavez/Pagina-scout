import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import {
  PawPrint, Bird, Compass, Tent, Mountain, HeartHandshake, X, Loader2, ImagePlus, Inbox, Lock, Upload, Pencil, RotateCcw,
} from 'lucide-react';
import * as db from '../lib/db.js';
import { saveText, useAuth, useContent, useToast } from '../lib/hooks.jsx';

export const RAMA_ICONS = { PawPrint, Bird, Compass, Tent, Mountain, HeartHandshake };

export function Logo({ size = 44 }) {
  const { site } = useContent();
  // Logo subido en Administración > Datos del sitio; si no hay, el logo oficial del grupo.
  return <img className="logo-img" src={site.logo || './logo.png'} width={size} height={size} alt="" aria-hidden="true" />;
}

/** Imagen de una rama; si no tiene imagen, muestra una ilustración con su color. */
export function RamaImage({ rama, src, className = '', alt }) {
  const url = src ?? rama.image;
  const Icon = RAMA_ICONS[rama.icon] || Compass;
  if (url) return <img className={`cover ${className}`} src={url} alt={alt || `Rama ${rama.name}`} loading="lazy" />;
  return (
    <div
      className={`cover placeholder ${className}`}
      style={{ background: `linear-gradient(135deg, ${rama.color}, ${rama.color}bb 60%, #19345F)` }}
      role="img"
      aria-label={`Ilustración de la rama ${rama.name}`}
    >
      <svg className="ph-pattern" viewBox="0 0 200 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <path d="M0 120 L50 50 L80 85 L120 30 L200 120 Z" fill="rgba(255,255,255,.14)" />
        <path d="M0 120 L35 80 L70 120 Z M110 120 L150 70 L200 120 Z" fill="rgba(255,255,255,.12)" />
        <circle cx="165" cy="28" r="12" fill="rgba(255,255,255,.22)" />
      </svg>
      <Icon size={56} strokeWidth={1.6} />
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  const ref = useRef();
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Loading({ text = 'Cargando…' }) {
  return (
    <div className="loading" role="status">
      <Loader2 className="spin" size={28} />
      <span>{text}</span>
    </div>
  );
}

export function Empty({ icon: Icon = Inbox, title, text, children }) {
  return (
    <div className="empty">
      <Icon size={40} strokeWidth={1.5} />
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

export function Field({ label, required, hint, children, full }) {
  return (
    <label className={`field ${full ? 'full' : ''}`}>
      <span className="field-label">
        {label} {required && <b className="req">*</b>}
      </span>
      {children}
      {hint && <small className="hint">{hint}</small>}
    </label>
  );
}

/** Devuelve una URL lista para mostrar; las referencias privadas se convierten en enlaces temporales. */
export function useResolvedUrl(src) {
  const [url, setUrl] = useState(db.isPrivateRef(src) ? '' : src);
  useEffect(() => {
    let alive = true;
    if (!db.isPrivateRef(src)) { setUrl(src); return undefined; }
    setUrl('');
    db.resolveUrl(src).then((u) => alive && setUrl(u)).catch(() => alive && setUrl(''));
    return () => { alive = false; };
  }, [src]);
  return url;
}

/** <img> que también sabe mostrar fotos privadas. */
export function SmartImg({ src, alt = '', ...props }) {
  const url = useResolvedUrl(src);
  if (!url) return <span className="img-loading" aria-label={alt} />;
  return <img src={url} alt={alt} {...props} />;
}

/** Enlace a un archivo que puede ser privado (se pide el enlace temporal al pulsarlo). */
export function SmartLink({ href, children, download, ...props }) {
  const toast = useToast();
  if (!db.isPrivateRef(href)) return <a href={href} download={download} {...props}>{children}</a>;
  const open = async (e) => {
    e.preventDefault();
    const w = window.open('', '_blank');
    try {
      const u = await db.resolveUrl(href);
      if (w) w.location.href = u; else window.location.href = u;
    } catch {
      if (w) w.close();
      toast('No se pudo abrir el archivo.', 'error');
    }
  };
  return <a href="#" onClick={open} {...props}>{children}</a>;
}

/** Selector de imagen: sube el archivo y devuelve la URL mediante onChange. */
export function ImageInput({ value, onChange, folder, label = 'Imagen', maxDim, private: priv = false, keepPng = false }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const inputRef = useRef();
  const pick = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Selecciona un archivo de imagen.', 'error');
    setBusy(true);
    try {
      onChange(await db.upload(file, { folder, maxDim, private: priv, keepPng }));
    } catch (e) {
      toast(e.message || 'No se pudo subir la imagen.', 'error');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };
  return (
    <div className="image-input">
      <div className="image-input-preview">
        {value ? <SmartImg src={value} alt="Vista previa" /> : <ImagePlus size={28} />}
        {busy && <div className="image-input-busy"><Loader2 className="spin" /></div>}
      </div>
      <div className="image-input-actions">
        <span className="field-label">{label}</span>
        <div className="row-gap">
          <button type="button" className="btn btn-sm btn-outline" onClick={() => inputRef.current.click()} disabled={busy}>
            <Upload size={16} /> {value ? 'Cambiar' : 'Subir'}
          </button>
          {value && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange('')} disabled={busy}>Quitar</button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files[0])} />
      </div>
    </div>
  );
}

/** Botón de administrador para cambiar una imagen directamente desde una tarjeta. */
export function ImageEditButton({ onSave, folder, label = 'Cambiar imagen', keepPng = false }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const ref = useRef();
  const pick = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      await onSave(await db.upload(file, { folder, keepPng }));
      toast('Imagen actualizada');
    } catch (e) {
      toast(e.message || 'No se pudo guardar la imagen.', 'error');
    } finally {
      setBusy(false);
      ref.current.value = '';
    }
  };
  return (
    <>
      <button
        type="button"
        className="img-edit-btn"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); ref.current.click(); }}
        disabled={busy}
        title={label}
      >
        {busy ? <Loader2 className="spin" size={16} /> : <ImagePlus size={16} />} <span>{busy ? 'Subiendo…' : label}</span>
      </button>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files[0])} />
    </>
  );
}

export function PageHero({ title, subtitle, eyebrow, color, tk }) {
  const w = (part, text) => (tk ? <T k={`${tk}.${part}`}>{text}</T> : text);
  return (
    <section className="page-hero" style={color ? { '--accent': color } : undefined}>
      <div className="container">
        {eyebrow && <span className="eyebrow">{w('eyebrow', eyebrow)}</span>}
        <h1>{w('title', title)}</h1>
        {subtitle && <p>{w('subtitle', subtitle)}</p>}
      </div>
    </section>
  );
}

/** Protege páginas privadas: exige sesión con rol aprobado. */
export function RequireMember({ children }) {
  const { user, ready, isMember } = useAuth();
  const loc = useLocation();
  if (!ready) return <div className="container section"><Loading /></div>;
  if (!user)
    return (
      <div className="container section">
        <Empty icon={Lock} title="Esta sección es privada" text="Inicia sesión para ver los contenidos del grupo.">
          <Link className="btn btn-primary" to="/ingresar" state={{ from: loc.pathname }}>Iniciar sesión</Link>
        </Empty>
      </div>
    );
  if (!isMember)
    return (
      <div className="container section">
        <Empty icon={Lock} title="Tu cuenta está pendiente de aprobación" text="Un administrador del grupo debe aprobar tu cuenta para que puedas ver esta sección." />
      </div>
    );
  return children;
}

export function useConfirm() {
  return (msg) => window.confirm(msg);
}

export function Instagram({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function Facebook({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}


/* ---------- Textos editables ---------- */

/**
 * Texto que un administrador puede cambiar desde la página.
 * Uso: <T k="inicio.titulo">Texto original</T>
 * Cada clave se guarda por separado; si se borra, vuelve el texto original.
 */
export function T({ k, children, multiline }) {
  const { texts, editMode } = useContent();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const original = typeof children === 'string' ? children : String(children ?? '');
  const value = texts[k] ?? original;
  if (!(isAdmin && editMode)) return <span className="t">{value}</span>;
  return (
    <>
      <span
        className="t editable"
        role="button"
        tabIndex={0}
        title="Clic para editar este texto"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); setOpen(true); } }}
      >
        {value}
      </span>
      {open && (
        <TextEditor k={k} original={original} value={value} edited={k in texts}
          multiline={multiline ?? (original.length > 60 || original.includes('\n'))} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function TextEditor({ k, original, value, edited, multiline, onClose }) {
  const [v, setV] = useState(value);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const run = async (next) => {
    setSaving(true);
    try {
      await saveText(k, next);
      toast(next === null ? 'Se restauró el texto original' : 'Texto guardado');
      onClose();
    } catch (e) {
      toast(e.message || 'No se pudo guardar', 'error');
      setSaving(false);
    }
  };
  // Portal + stopPropagation: el editor puede estar dentro de un botón o enlace,
  // y los clics dentro del cuadro no deben activarlos.
  return createPortal(
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Modal title="Editar texto" onClose={onClose}>
        <form className="form" onSubmit={(e) => { e.preventDefault(); if (v.trim()) run(v.trim()); }}>
          <Field label="Texto" full>
            {multiline
              ? <textarea rows={5} value={v} onChange={(e) => setV(e.target.value)} autoFocus />
              : <input value={v} onChange={(e) => setV(e.target.value)} autoFocus />}
          </Field>
          <p className="hint">Original: “{original}”</p>
          <div className="form-actions">
            {edited && (
              <button type="button" className="btn btn-ghost" onClick={() => run(null)} disabled={saving}>
                <RotateCcw size={16} /> Restaurar original
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" disabled={saving || !v.trim()}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </div>,
    document.body
  );
}

/** Botón flotante para que los administradores activen o desactiven la edición de textos. */
export function EditModeToggle() {
  const { isAdmin } = useAuth();
  const { editMode, setEditMode } = useContent();
  if (!isAdmin) return null;
  return (
    <>
      {editMode && (
        <div className="edit-banner" role="status">
          <Pencil size={16} /> Modo edición: haz clic en cualquier texto con borde punteado para cambiarlo.
        </div>
      )}
      <button type="button" className={`edit-toggle ${editMode ? 'on' : ''}`} onClick={() => setEditMode(!editMode)}>
        <Pencil size={18} /> {editMode ? 'Terminar edición' : 'Editar textos'}
      </button>
    </>
  );
}
