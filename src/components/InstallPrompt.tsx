import { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    // 1. Verifica se já está instalado
    const isAppMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isAppMode);

    if (isAppMode) return; 

    // 2. Verifica se o usuário já fechou este banner
    const dismissed = localStorage.getItem('cleverya-pwa-dismissed');
    if (dismissed) return;

    // 3. Detecta se é iPhone/iPad
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
       setShowInstallPrompt(true);
    }

    // 4. Detecta Android/Chrome
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); 
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const dismissPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('cleverya-pwa-dismissed', 'true');
  };

  if (!showInstallPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-[9999] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-primary/30 flex flex-col gap-3 animate-in slide-in-from-bottom-10 max-w-md mx-auto">
      <button onClick={dismissPrompt} className="absolute top-2 right-2 text-slate-400 hover:text-white p-1">
        <X className="w-5 h-5" />
      </button>
      
      <div className="flex items-center gap-4">
         <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 border border-slate-700 overflow-hidden">
            <img src="/logo.png" alt="Cleverya" className="w-8 h-8 object-contain" />
         </div>
         <div className="pr-4">
            <h3 className="font-bold text-sm text-white">Instalar Painel Cleverya</h3>
            <p className="text-xs text-slate-400 leading-tight mt-0.5">Gerencie a sua agenda direto da tela inicial do celular.</p>
         </div>
      </div>

      {isIOS ? (
         <div className="bg-slate-800 p-3 rounded-xl text-xs text-slate-300 flex items-start gap-3 mt-1">
            <Share className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p>
              No iPhone, clique em <strong>Compartilhar</strong> na barra inferior e escolha <span className="whitespace-nowrap"><PlusSquare className="w-3 h-3 inline pb-0.5 text-slate-400"/> <strong>Tela de Início</strong></span>.
            </p>
         </div>
      ) : (
         <button 
            onClick={handleInstallClick} 
            className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all mt-1"
         >
            <Download className="w-4 h-4" /> Instalar Aplicativo
         </button>
      )}
    </div>
  );
}