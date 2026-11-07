import { Link } from 'react-router-dom';
import {
  Compass, CalendarDays, MessageCircle, Trees, Users, HeartHandshake, Sparkles, Flame, Map, Award, ArrowRight, CheckCircle2,
} from 'lucide-react';
import RamaCard from '../components/RamaCard.jsx';
import { Loading, T } from '../components/ui.jsx';
import { useRamas } from '../lib/hooks.jsx';

const BENEFITS = [
  { icon: Trees, title: 'Vida al aire libre', text: 'Campamentos, excursiones y aprendizaje en contacto con la naturaleza.' },
  { icon: Users, title: 'Amistad y comunidad', text: 'Un espacio seguro para crecer junto a otros niños, niñas y jóvenes.' },
  { icon: HeartHandshake, title: 'Servicio', text: 'Aprendemos a ayudar y a comprometernos con nuestro entorno.' },
  { icon: Award, title: 'Liderazgo', text: 'Cada joven asume desafíos y responsabilidades a su medida.' },
];

const EXPERIENCE = [
  { icon: Flame, title: 'Fogatas y campamentos', text: 'Noches bajo las estrellas, canciones y tradiciones que se recuerdan toda la vida.' },
  { icon: Map, title: 'Aventura y exploración', text: 'Rutas, orientación, pionerismo y técnicas scout para desenvolverse en cualquier lugar.' },
  { icon: Sparkles, title: 'Aprender haciendo', text: 'Proyectos reales donde cada uno descubre sus talentos y los pone al servicio de los demás.' },
];

export default function Home() {
  const { ramas, loading } = useRamas();
  return (
    <>
      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <svg viewBox="0 0 1440 400" preserveAspectRatio="none">
            <path d="M0 400 L240 170 L380 290 L620 90 L860 300 L1040 180 L1240 300 L1440 140 L1440 400 Z" fill="rgba(255,255,255,.06)" />
            <path d="M0 400 L180 280 L360 360 L560 240 L760 380 L980 260 L1200 360 L1440 260 L1440 400 Z" fill="rgba(255,255,255,.08)" />
          </svg>
        </div>
        <div className="container hero-inner">
          <span className="eyebrow light"><T k="inicio.portada.antetitulo">Asociación de Guías y Scouts de Chile</T></span>
          <h1><T k="inicio.portada.titulo1">Grupo Scout</T> <span className="accent"><T k="inicio.portada.titulo2">Alcázar</T></span></h1>
          <p className="lead"><T k="inicio.portada.texto">Desde Las Condes, invitamos a niñas, niños y jóvenes de 7 a 19 años a vivir el escultismo: aventura, amistad, naturaleza y servicio.</T></p>
          <div className="hero-cta">
            <Link className="btn btn-primary btn-lg" to="/contacto"><MessageCircle size={20} /> <T k="inicio.portada.boton1">Contáctanos</T></Link>
            <Link className="btn btn-light btn-lg" to="/ramas"><Compass size={20} /> <T k="inicio.portada.boton2">Explora las ramas</T></Link>
            <Link className="btn btn-outline-light btn-lg" to="/eventos"><CalendarDays size={20} /> <T k="inicio.portada.boton3">Ver eventos</T></Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="reveal">
            <span className="eyebrow"><T k="inicio.grupo.antetitulo">Quiénes somos</T></span>
            <h2><T k="inicio.grupo.titulo">Un lugar para crecer, explorar y servir</T></h2>
            <p><T k="inicio.grupo.texto">Somos un grupo scout de Las Condes formado por familias, jóvenes y dirigentes voluntarios. Cada sábado nos reunimos para jugar, aprender y prepararnos para nuevas aventuras, siguiendo el método scout de la Asociación de Guías y Scouts de Chile.</T></p>
            <ul className="checklist">
              <li><CheckCircle2 size={20} /> <T k="inicio.grupo.punto1">Programa adaptado a cada edad</T></li>
              <li><CheckCircle2 size={20} /> <T k="inicio.grupo.punto2">Dirigentes capacitados y comprometidos</T></li>
              <li><CheckCircle2 size={20} /> <T k="inicio.grupo.punto3">Actividades seguras y con propósito</T></li>
            </ul>
            <Link to="/quienes-somos" className="btn btn-secondary"><T k="inicio.grupo.boton">Conoce nuestra historia</T> <ArrowRight size={18} /></Link>
          </div>
          <div className="benefit-grid">
            {BENEFITS.map(({ icon: Icon, title, text }, i) => (
              <div className="card benefit reveal" key={title}>
                <span className="icon-circle"><Icon size={24} /></span>
                <h3><T k={`inicio.beneficio${i + 1}.titulo`}>{title}</T></h3>
                <p><T k={`inicio.beneficio${i + 1}.texto`}>{text}</T></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow"><T k="inicio.experiencia.antetitulo">La experiencia scout</T></span>
            <h2><T k="inicio.experiencia.titulo">Más que una actividad de fin de semana</T></h2>
            <p><T k="inicio.experiencia.texto">El escultismo es un movimiento educativo presente en más de 170 países. Aquí cada joven es protagonista de su propio crecimiento.</T></p>
          </div>
          <div className="grid-3">
            {EXPERIENCE.map(({ icon: Icon, title, text }, i) => (
              <div className="card feature reveal" key={title}>
                <span className="icon-circle orange"><Icon size={26} /></span>
                <h3><T k={`inicio.experiencia${i + 1}.titulo`}>{title}</T></h3>
                <p><T k={`inicio.experiencia${i + 1}.texto`}>{text}</T></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow"><T k="inicio.ramas.antetitulo">Nuestras ramas</T></span>
            <h2><T k="inicio.ramas.titulo">Una unidad para cada etapa</T></h2>
            <p><T k="inicio.ramas.texto">Seis ramas acompañan a niñas, niños y jóvenes en cada momento de su desarrollo.</T></p>
          </div>
          {loading ? <Loading /> : (
            <div className="grid-3">{ramas.map((r) => <RamaCard key={r.id} rama={r} cta="Conocer" />)}</div>
          )}
        </div>
      </section>

      <section className="section section-tint">
        <div className="container join reveal">
          <div>
            <span className="eyebrow"><T k="inicio.unirse.antetitulo">Súmate</T></span>
            <h2><T k="inicio.unirse.titulo">¿Cómo integrarse al grupo?</T></h2>
          </div>
          <ol className="steps">
            <li><b>1</b><div><h3><T k="inicio.paso1.titulo">Escríbenos</T></h3><p><T k="inicio.paso1.texto">Completa el formulario de contacto con la edad de tu hijo o hija.</T></p></div></li>
            <li><b>2</b><div><h3><T k="inicio.paso2.titulo">Ven a una reunión</T></h3><p><T k="inicio.paso2.texto">Te invitamos a un sábado de prueba para conocer la rama.</T></p></div></li>
            <li><b>3</b><div><h3><T k="inicio.paso3.titulo">Inscríbete</T></h3><p><T k="inicio.paso3.texto">Completa la inscripción en la Asociación y ¡comienza la aventura!</T></p></div></li>
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-final reveal">
            <h2><T k="inicio.final.titulo">¿Listos para la aventura?</T></h2>
            <p><T k="inicio.final.texto">Ven a conocernos un sábado. Te esperamos con los brazos abiertos y el pañolín puesto.</T></p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" to="/contacto?motivo=inscripcion"><T k="inicio.final.boton1">Quiero unirme</T></Link>
              <Link className="btn btn-outline-light btn-lg" to="/preguntas-frecuentes"><T k="inicio.final.boton2">Preguntas frecuentes</T></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
