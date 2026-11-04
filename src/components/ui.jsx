import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  PawPrint, Bird, Compass, Tent, Mountain, HeartHandshake, X, Loader2, ImagePlus, Inbox, Lock, Upload,
} from 'lucide-react';
import * as db from '../lib/db.js';
import { useAuth, useToast } from '../lib/hooks.jsx';

export const RAMA_ICONS = { PawPrint, Bird, Compass, Tent, Mountain, HeartHandshake };

export function Logo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill="#19345F" stroke="#F57514" strokeWidth="2" />
      <path
        fill="#F57514"
        d="M32 9c-4 5-6 10-6 15 0 4 2 7 4 9-3 0-6-2-8-5-2-4-1-8 1-11-6 2-10 8-9 14 1 5 5 8 10 8h3v4h-5v4h5v8h10v-8h5v-4h-5v-4h3c5 0 9-3 10-8 1-6-3-12-9-14 2 3 3 7 1 11-2 3-5 5-8 5 2-2 4-5 4-9 0-5-2-10-6-15z"
      />
    </svg>
  );
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

/** Selector de imagen: sube el archivo y devuelve la URL mediante onChange. */
export function ImageInput({ value, onChange, folder, label = 'Imagen', maxDim }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const inputRef = useRef();
  const pick = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Selecciona un archivo de imagen.', 'error');
    setBusy(true);
    try {
      onChange(await db.upload(file, { folder, maxDim }));
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
        {value ? <img src={value} alt="Vista previa" /> : <ImagePlus size={28} />}
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
export function ImageEditButton({ onSave, folder, label = 'Cambiar imagen' }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const ref = useRef();
  const pick = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      await onSave(await db.upload(file, { folder }));
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

export function PageHero({ title, subtitle, eyebrow, color }) {
  return (
    <section className="page-hero" style={color ? { '--accent': color } : undefined}>
      <div className="container">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
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
