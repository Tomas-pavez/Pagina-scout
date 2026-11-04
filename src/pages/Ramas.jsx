import { Link } from 'react-router-dom';
import RamaCard from '../components/RamaCard.jsx';
import { Loading, PageHero, RAMA_ICONS } from '../components/ui.jsx';
import { useRamas } from '../lib/hooks.jsx';

export default function Ramas() {
  const { ramas, loading } = useRamas();
  return (
    <>
      <PageHero eyebrow="Unidades" title="Nuestras ramas" subtitle="Seis unidades que acompañan a cada joven según su edad, con un programa pensado para su etapa de vida." />
      <section className="section">
        <div className="container">
          <div className="quick-links reveal">
            {ramas.map((r) => {
              const Icon = RAMA_ICONS[r.icon];
              return (
                <Link key={r.id} to={`/ramas/${r.id}`} className="quick-link" style={{ '--rama': r.color }}>
                  <span className="quick-icon"><Icon size={20} /></span>
                  <span><strong>{r.name}</strong><small>{r.ages}</small></span>
                </Link>
              );
            })}
          </div>
          {loading ? <Loading /> : <div className="grid-3">{ramas.map((r) => <RamaCard key={r.id} rama={r} />)}</div>}
        </div>
      </section>
    </>
  );
}
