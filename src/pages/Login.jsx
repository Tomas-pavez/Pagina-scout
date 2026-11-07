import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { Field, Logo } from '../components/ui.jsx';
import { useAuth, useToast } from '../lib/hooks.jsx';
import * as db from '../lib/db.js';

export default function Login() {
  const { user } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const from = loc.state?.from || '/';
  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        const u = await db.auth.login(f.email, f.password);
        toast(`¡Hola, ${u.name.split(' ')[0]}!`);
      } else {
        const u = await db.auth.register(f.name, f.email, f.password);
        if (!u) toast('Revisa tu correo para confirmar la cuenta.');
        else if (u.role === 'admin') toast('Cuenta creada como administrador');
        else toast('Cuenta creada. Un administrador debe aprobarla.');
      }
      nav(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError('');
    setBusy(true);
    try {
      await db.auth.loginWithGoogle(); // la página se va a Google y vuelve con la sesión iniciada
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <section className="section auth-section">
      <div className="card auth-card">
        <div className="center"><Logo size={64} /></div>
        <h1>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
        <p className="muted center">{mode === 'login' ? 'Accede a fotos, eventos, comunicaciones y equipo.' : 'Las cuentas nuevas quedan pendientes hasta que un administrador las apruebe.'}</p>
        {db.GOOGLE_ENABLED && (
          <>
            <button type="button" className="btn btn-google btn-lg btn-block" onClick={google} disabled={busy}>
              <GoogleIcon /> Continuar con Google
            </button>
            <div className="divider"><span>o con tu correo</span></div>
          </>
        )}
        <form className="form" onSubmit={submit}>
          {mode === 'register' && <Field label="Nombre" required full><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></Field>}
          <Field label="Correo" required full><input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></Field>
          <Field label="Contraseña" required full><input required type="password" minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></Field>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {mode === 'login' ? <><LogIn size={18} /> {busy ? 'Ingresando…' : 'Ingresar'}</> : <><UserPlus size={18} /> {busy ? 'Creando…' : 'Crear cuenta'}</>}
          </button>
        </form>
        <button className="btn btn-ghost btn-block" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
