import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { queries } = useDatabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [mustChangePasswordMode, setMustChangePasswordMode] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!tempUserId) return;

    try {
      await queries.updateUserPassword(tempUserId, newPassword);
      // Login automatically
      localStorage.setItem('currentUserId', tempUserId);
      navigate('/');
    } catch (err) {
      setError('Error al actualizar la contraseña.');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-slate-100 dark:border-zinc-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
          {mustChangePasswordMode ? 'Actualizar Contraseña' : (isRegister ? 'Create account' : 'Welcome back')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
          {mustChangePasswordMode ? 'Debes cambiar tu contraseña para continuar' : (isRegister ? 'Crea tu cuenta para continuar' : 'Inicia sesión para continuar')}
        </p>

        {mustChangePasswordMode ? (
          <form className="space-y-4" onSubmit={handleChangePasswordSubmit}>
             <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <p className="text-xs text-red-500">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full h-10 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors mt-2"
            >
              Actualizar y Continuar
            </button>
            <button
              type="button"
              onClick={() => {
                setMustChangePasswordMode(false);
                setTempUserId(null);
                setNewPassword('');
                setConfirmNewPassword('');
                setError('');
                setPassword(''); // clear password to force re-entry or just clean state
              }}
              className="mt-3 w-full text-xs text-slate-600 dark:text-slate-300 underline"
            >
              Cancelar
            </button>
          </form>
        ) : (
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError('');

            if (password.length < 6) {
              setError('La contraseña debe tener al menos 6 caracteres.');
              return;
            }

            if (isRegister) {
              if (password !== confirmPassword) {
                setError('Las contraseñas no coinciden.');
                return;
              }

              try {
                const user = await queries.registerUser(email, password);
                localStorage.setItem('currentUserId', user.id);
                navigate('/');
              } catch (err) {
                console.error("Registration error:", err);
                if (err instanceof Error && err.message === 'USER_ALREADY_EXISTS') {
                  setError('Ya existe una cuenta con este correo.');
                } else {
                  setError('No se pudo crear la cuenta. Inténtalo de nuevo.');
                }
              }
              return;
            }

            try {
              const user = await queries.loginUser(email, password);
              
              if (user.mustChangePassword) {
                 setMustChangePasswordMode(true);
                 setTempUserId(user.id);
                 setError(''); // Clear any previous errors
                 return;
              }

              localStorage.setItem('currentUserId', user.id);
              navigate('/');
            } catch (err) {
              console.error("Login error:", err);
              if (err instanceof Error) {
                if (err.message === 'INVALID_PASSWORD') {
                  setError('La contraseña no es correcta.');
                } else if (err.message === 'USER_NOT_FOUND') {
                  setError('No existe una cuenta con este correo.');
                } else if (err.message === 'USER_INACTIVE') {
                  setError('Esta cuenta ha sido desactivada. Contacta al soporte.');
                } else {
                  setError('No se pudo iniciar sesión. Inténtalo de nuevo.');
                }
              } else {
                setError('Ocurrió un error inesperado.');
              }
            }
          }}
        >
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              placeholder="••••••••"
              required
            />
          </div>

          {isRegister && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                placeholder="Repite la contraseña"
                required
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full h-10 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors mt-2"
          >
            {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>

          <button
            type="button"
            className="mt-3 w-full text-xs text-slate-600 dark:text-slate-300 underline"
            onClick={() => {
              setError('');
              setConfirmPassword('');
              setIsRegister(!isRegister);
            }}
          >
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Crear una nueva'}
          </button>
        </form>
        )}

        <div className="mt-6 border-t border-slate-100 dark:border-zinc-800 pt-4 flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
