import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

const OfflineIndicator = () => {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 z-50 animate-fade-in-up">
      <WifiOff size={20} className="text-red-400" />
      <span className="font-medium text-sm">Sin conexión a internet. Trabajando offline.</span>
    </div>
  );
};

export default OfflineIndicator;
