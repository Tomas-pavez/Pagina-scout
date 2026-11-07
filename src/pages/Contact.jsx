import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Clock, Mail, Send, CheckCircle2 } from 'lucide-react';
import { Field, PageHero, Instagram, Facebook } from '../components/ui.jsx';
import { CONTACT_REASONS } from '../data/seed.js';
import { useSettings, useToast } from '../lib/hooks.jsx';
import * as db from '../lib/db.js';

export default function Contact() {
  const [params] = useSearchParams();
  const { settings } = useSettings();
  const initialReason = params.get('motivo') === 'inscripcion' ? CONTACT_REASONS[0] : CONTACT_REASONS[1];
  const blank = { name: '', email: '', phone: '', reason: initialReason, message: '' };
  const [f, setF] = useState(blank);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.email.trim() || !f.message.trim()) return toast('Completa los campos obligatorios', 'error');
    setSending(true);
    try {
      await db.save('messages', { ...f, name: f.name.trim(), email: f.email.trim(), read: false });
      setSent(true);
    } catch (err) {
      toast(err.message || 'No se pudo enviar el mensaje', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHero tk="contacto.cabecera" eyebrow="Contacto" title="Conversemos" subtitle="¿Quieres inscribirte, tienes dudas o te gustaría ser dirigente? Escríbenos." />
      <section className="section">
        <div className="container contact-layout">
          <div className="contact-info">
            <div className="card info-item reveal"><span className="icon-circle"><MapPin size={22} /></span><div><h3>Dirección</h3><p>{settings.address}</p></div></div>
            <div className="card info-item reveal"><span className="icon-circle"><Clock size={22} /></span><div><h3>Horario de actividades</h3><p>{settings.schedule}</p></div></div>
            {settings.email && <div className="card info-item reveal"><span className="icon-circle"><Mail size={22} /></span><div><h3>Correo</h3><p><a href={`mailto:${settings.email}`}>{settings.email}</a></p></div></div>}
            <div className="socials big reveal">
              {settings.instagram && <a className="btn btn-outline" href={settings.instagram} target="_blank" rel="noreferrer"><Instagram size={18} /> Instagram</a>}
              {settings.facebook && <a className="btn btn-outline" href={settings.facebook} target="_blank" rel="noreferrer"><Facebook size={18} /> Facebook</a>}
            </div>
          </div>
          <div className="card form-card reveal">
            {sent ? (
              <div className="success">
                <CheckCircle2 size={56} />
                <h2>¡Mensaje enviado!</h2>
                <p>Gracias por escribirnos, {f.name.split(' ')[0]}. Te responderemos pronto a {f.email}.</p>
                <button className="btn btn-primary" onClick={() => { setF(blank); setSent(false); }}>Enviar otro mensaje</button>
              </div>
            ) : (
              <form className="form" onSubmit={submit}>
                <h2>Envíanos un mensaje</h2>
                <div className="form-grid">
                  <Field label="Nombre" required><input required value={f.name} onChange={set('name')} autoComplete="name" /></Field>
                  <Field label="Correo" required><input required type="email" value={f.email} onChange={set('email')} autoComplete="email" /></Field>
                  <Field label="Teléfono (opcional)"><input type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" /></Field>
                  <Field label="Motivo de contacto">
                    <select value={f.reason} onChange={set('reason')}>{CONTACT_REASONS.map((r) => <option key={r}>{r}</option>)}</select>
                  </Field>
                  <Field label="Mensaje" required full><textarea required rows={6} value={f.message} onChange={set('message')} /></Field>
                </div>
                <button className="btn btn-primary btn-lg" disabled={sending}><Send size={18} /> {sending ? 'Enviando…' : 'Enviar mensaje'}</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
