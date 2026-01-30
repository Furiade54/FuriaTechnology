import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import ConfirmationModal from './ConfirmationModal';

const PromoBanner: React.FC = () => {
  const navigate = useNavigate();
  const { queries } = useDatabase();
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  const handleTrackOrder = async () => {
    try {
      const user = await queries.getCurrentUser();
      if (user) {
        navigate('/profile', { state: { openOrders: true } });
      } else {
        setShowAuthWarning(true);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      // Fallback to showing warning if check fails
      setShowAuthWarning(true);
    }
  };

  return (
    <div className="p-4">
      <div 
        onClick={handleTrackOrder}
        className="flex items-center justify-between rounded-lg bg-primary/20 dark:bg-primary/30 p-4 cursor-pointer active:scale-95 transition-transform"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center size-12 bg-primary rounded-full">
            <span className="material-symbols-outlined text-white">local_shipping</span>
          </div>
          <div>
            <p className="font-bold text-base text-slate-900 dark:text-white">Rastrear Pedido</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Revisa el estado de tus compras</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-slate-900 dark:text-white">arrow_forward_ios</span>
      </div>

      <ConfirmationModal
        isOpen={showAuthWarning}
        onClose={() => setShowAuthWarning(false)}
        onConfirm={() => {
          setShowAuthWarning(false);
          navigate('/login');
        }}
        title="Iniciar Sesión Requerido"
        message="Para rastrear tus pedidos, necesitas iniciar sesión con tu cuenta."
        confirmText="Iniciar Sesión"
        cancelText="Cancelar"
        icon="lock"
      />
    </div>
  );
};

export default PromoBanner;
