import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { RamaImage, ImageEditButton } from './ui.jsx';
import { useAuth } from '../lib/hooks.jsx';
import * as db from '../lib/db.js';

/** Tarjeta de una rama. El botón de imagen guarda SOLO el campo "image" de esta rama. */
export default function RamaCard({ rama, cta = 'Ver más' }) {
  const { isAdmin } = useAuth();
  return (
    <article className="card rama-card reveal" style={{ '--rama': rama.color }}>
      <div className="rama-card-media">
        <RamaImage rama={rama} />
        <span className="age-badge">{rama.ages}</span>
        {isAdmin && (
          <ImageEditButton folder={`ramas/${rama.id}`} onSave={(image) => db.patch('ramas', rama.id, { image })} />
        )}
      </div>
      <div className="card-body">
        <h3><span className="dot" style={{ background: rama.color }} />{rama.name}</h3>
        <p>{rama.description}</p>
        <Link to={`/ramas/${rama.id}`} className="btn btn-rama btn-sm">
          {cta} <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
