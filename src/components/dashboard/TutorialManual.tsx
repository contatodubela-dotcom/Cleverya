import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'; 
import { Button } from '../ui/button';
import { 
  ClipboardList, 
  Users, 
  Settings, 
  Share2, 
  CalendarCheck, 
  ArrowRight, 
  CheckCircle2, 
  Smartphone, 
  Printer 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TutorialManualProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TutorialManual({ open, onOpenChange }: TutorialManualProps) {
  const { t } = useTranslation();

  const handlePrint = () => {
    window.print();
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
      desc: t('tutorial.step3_desc', { defaultValue: 'Em "Ajustes", defina Horários e Nome. FOTO: O sistema exige um Link Direto (terminado em .jpg/.png). ❌ Não use link do Canva/Drive. ✅ Dica: Suba a foto no "Imgur.com", copie o "Direct Link" e cole aqui.' }),
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
    },
    {
      icon: Smartphone,
      title: t('tutorial.step6_title', { defaultValue: '6. Instale o App' }),
      desc: t('tutorial.step6_desc', { defaultValue: 'Instale direto pelo navegador (Adicionar à Tela Inicial) sem ocupar memória do celular.' }),
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10'
    }
  ];

  return (
    <>
      {/* CSS DE IMPRESSÃO */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          html, body { height: auto !important; overflow: visible !important; background: white !important; }
          #printable-content, #printable-content * { visibility: visible; }
          #printable-content {
            display: block !important;
            position: absolute;
            left: 0; top: 0; width: 100%;
            margin: 0; padding: 40px;
            background: white; color: black; z-index: 9999;
          }
          .print-icon { color: black !important; stroke: black !important; }
          .print-text { color: black !important; }
          .print-desc { color: #333 !important; }
        }
      `}</style>

      {/* ÁREA DE IMPRESSÃO */}
      <div id="printable-content" className="hidden">
        <div className="mb-8 border-b pb-4 border-gray-300">
            <h1 className="text-3xl font-bold text-black mb-2 flex items-center gap-2">
               🚀 {t('tutorial.welcome_title', { defaultValue: 'Bem-vindo ao Cleverya!' })}
            </h1>
            <p className="text-gray-600 text-lg">
                {t('tutorial.welcome_subtitle', { defaultValue: 'Guia de Configuração e Instalação' })}
            </p>
        </div>
        <div className="space-y-6">
            {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                    <div key={index} className="flex gap-4 items-start pb-4 border-b border-gray-100 break-inside-avoid">
                        <div className="w-10 h-10 flex items-center justify-center border-2 border-gray-800 rounded-lg shrink-0">
                            <Icon className="w-6 h-6 print-icon" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-black print-text">{step.title}</h3>
                            <p className="text-gray-800 mt-1 text-base leading-relaxed print-desc">{step.desc}</p>
                        </div>
                    </div>
                )
            })}
        </div>
        <div className="mt-8 pt-4 border-t border-gray-300 text-sm text-gray-500 text-center">
            Cleverya - {new Date().getFullYear()}
        </div>
      </div>

      {/* MODAL VISUAL */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#0f172a] border-white/10 text-white p-0 gap-0 print:hidden">
          <div className="bg-gradient-to-r from-primary/20 via-[#0f172a] to-[#0f172a] p-6 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-white">
                <span className="text-3xl">📚</span> 
                {t('common.help', { defaultValue: 'Manual de Ajuda' })}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            
            {/* --- VÍDEO TUTORIAL INCORPORADO NO MANUAL --- */}
            <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/raqvaVPqCgs?si=X7qLOgaZz-TaFE2h" 
                title="Tutorial Cleverya" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="border-0"
              ></iframe>
            </div>
            {/* ------------------------------------------- */}

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
            <Button 
              variant="outline" 
              onClick={handlePrint}
              className="w-full border-white/10 hover:bg-white/5 text-slate-300 gap-2"
            >
              <Printer className="w-4 h-4" />
              {t('tutorial.btn_print', { defaultValue: 'Baixar Manual em PDF' })}
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </>
  );
}