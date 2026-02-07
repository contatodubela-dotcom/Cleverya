import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { ClipboardList, Users, Settings, Share2, CalendarCheck, ArrowRight, CheckCircle2 } from 'lucide-react'; // Adicionado CalendarCheck
import { useTranslation } from 'react-i18next';

export default function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('cleverya_tutorial_seen');
    if (!hasSeenTutorial) {
      setTimeout(() => setOpen(true), 1000);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem('cleverya_tutorial_seen', 'true');
  };

  const steps = [
    {
      icon: ClipboardList,
      title: t('tutorial.step1_title', { defaultValue: '1. Cadastre seus Serviços' }),
      desc: t('tutorial.step1_desc', { defaultValue: 'Vá na aba "Serviços" e crie o que você oferece (ex: Corte, Barba).' }),
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      icon: Users,
      title: t('tutorial.step2_title', { defaultValue: '2. Cadastre a Equipe' }),
      desc: t('tutorial.step2_desc', { defaultValue: 'Em "Equipe", cadastre quem atende. No plano Free, cadastre você mesmo.' }),
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    },
    {
      icon: Settings,
      title: t('tutorial.step3_title', { defaultValue: '3. Ajustes e Foto' }),
      desc: t('tutorial.step3_desc', { defaultValue: 'Em "Ajustes", defina Horários e Nome do local. Para a FOTO: Copie o link de uma imagem (Google Imagens) e cole no campo indicado.' }),
      color: 'text-green-400',
      bg: 'bg-green-500/10'
    },
    {
      icon: Share2,
      title: t('tutorial.step4_title', { defaultValue: '4. Divulgue seu Link' }),
      desc: t('tutorial.step4_desc', { defaultValue: 'Copie seu link no topo da página e coloque na bio do Instagram ou envie no WhatsApp.' }),
      color: 'text-amber-400',
      bg: 'bg-amber-500/10'
    },
    {
      icon: CalendarCheck,
      title: t('tutorial.step5_title', { defaultValue: '5. Gerencie a Agenda' }),
      desc: t('tutorial.step5_desc', { defaultValue: 'Novos agendamentos aparecem na aba "Agenda". Confirme e envie mensagem no Zap. O cliente também recebe notificação por e-mail.' }),
      color: 'text-rose-400',
      bg: 'bg-rose-500/10'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#0f172a] border-white/10 text-white p-0 gap-0">
        
        <div className="bg-gradient-to-r from-primary/20 via-[#0f172a] to-[#0f172a] p-6 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-white">
              <span className="text-3xl">🚀</span> 
              {t('tutorial.welcome_title', { defaultValue: 'Bem-vindo ao Cleverya!' })}
            </DialogTitle>
            <p className="text-slate-400 mt-2 text-sm">
              {t('tutorial.welcome_subtitle', { defaultValue: 'Siga estes 5 passos para lotar sua agenda:' })}
            </p>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex gap-4 items-start group">
                <div className={`w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center shrink-0 mt-1 transition-transform group-hover:scale-110`}>
                  <Icon className={`w-5 h-5 ${step.color}`} />
                </div>
                <div>
                  <h3 className={`font-bold text-base ${step.color}`}>{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="bg-slate-900/50 p-6 border-t border-white/5 flex-col sm:flex-row gap-3 sticky bottom-0 z-10">
          <div className="flex-1 flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4" />
            {t('tutorial.auto_save', { defaultValue: 'Siga a ordem para evitar erros.' })}
          </div>
          <Button onClick={handleClose} className="bg-primary hover:bg-primary/90 text-slate-950 font-bold px-8 w-full sm:w-auto">
            {t('tutorial.btn_start', { defaultValue: 'Entendi, vamos lá!' })} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}