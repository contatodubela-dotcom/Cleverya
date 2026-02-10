import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { 
  Store, 
  Scissors, 
  Clock, 
  Share2, 
  Smartphone, 
  Loader2, 
  Image as ImageIcon,
  Copy,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: '',
    whatsapp: '',
    bannerUrl: '',
    serviceName: '',
    servicePrice: '',
    serviceDuration: '30',
    useStandardHours: true
  });

  useEffect(() => {
    checkUserStatus();
  }, []);

  async function checkUserStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, whatsapp, banner_url')
      .eq('owner_id', user.id)
      .single();

    if (business) {
      setBusinessId(business.id);
      
      setFormData(prev => ({
        ...prev,
        businessName: business.name || '',
        whatsapp: business.whatsapp || '',
        bannerUrl: business.banner_url || ''
      }));

      // Se whatsapp estiver vazio ou nulo, abre o modal
      if (!business.whatsapp || business.whatsapp.trim().length < 8) {
        setTimeout(() => setOpen(true), 500);
      }
    }
  }

  const handleClose = () => {
    if (step === 5) {
      setOpen(false);
      window.location.reload();
    }
  };

  // --- MÁSCARA E VALIDAÇÃO DE TELEFONE ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove tudo que não é número
    
    // Limita a 11 dígitos (DDD + 9 dígitos)
    if (value.length > 11) value = value.slice(0, 11);
    
    // Aplica a máscara visualmente
    if (value.length > 10) {
        // Formato Celular: (11) 99999-9999
        value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (value.length > 6) {
        // Formato Fixo/Incompleto: (11) 9999-9999
        value = value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (value.length > 2) {
        // Apenas DDD: (11) ...
        value = value.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2");
    } else {
        // Digitando DDD
        value = value.replace(/^(\d*)/, "($1");
    }
    
    setFormData({ ...formData, whatsapp: value });
  };

  // Verifica se o telefone tem pelo menos 10 números reais (DDD + 8 dígitos)
  const isPhoneValid = () => {
      const cleanNumber = formData.whatsapp.replace(/\D/g, "");
      return cleanNumber.length >= 10;
  };

  const validateImage = (url: string) => {
    if (!url) return true;
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/) != null;
  };

  const saveStep1 = async () => {
    // 1. Validação Dupla
    if (!formData.businessName || !formData.whatsapp) {
      toast.error(t('toasts.error_general', { defaultValue: 'Preencha os campos obrigatórios' }));
      return;
    }

    if (!isPhoneValid()) {
        toast.error("Número de WhatsApp inválido. Digite o DDD + Número.");
        return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ 
          name: formData.businessName, 
          whatsapp: formData.whatsapp,
          banner_url: formData.bannerUrl || null
        })
        .eq('id', businessId);

      if (error) throw error;
      setStep(2);
      toast.success("Perfil salvo!");
    } catch (e) {
      toast.error("Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const saveStep2 = async () => {
    if (!formData.serviceName || !formData.servicePrice) {
      toast.error("Preencha os dados do serviço");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('services').insert({
        business_id: businessId,
        name: formData.serviceName,
        price: parseFloat(formData.servicePrice.replace(',', '.')),
        duration_minutes: parseInt(formData.serviceDuration),
        is_active: true
      });

      if (error) throw error;
      setStep(3);
    } catch (e) {
      toast.error("Erro ao criar serviço.");
    } finally {
      setLoading(false);
    }
  };

  const saveStep3 = async () => {
    setLoading(true);
    try {
      if (formData.useStandardHours) {
        const slots = [1, 2, 3, 4, 5].map(day => ({
          business_id: businessId,
          day_of_week: day,
          start_time: '09:00',
          end_time: '18:00',
          is_active: true
        }));
        
        await supabase.from('availability_settings').delete().eq('business_id', businessId);
        await supabase.from('availability_settings').insert(slots);
      }
      setStep(4);
    } catch (e) {
      toast.error("Erro ao salvar horários");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    const link = `https://cleverya.com/${formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`; 
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  // --- RENDERIZAÇÃO ---
  const renderStep = () => {
    switch(step) {
      case 1: 
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{t('wizard.step1_title')}</h2>
              <p className="text-slate-400 text-sm mt-1">{t('wizard.step1_subtitle')}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5 block">
                    {t('wizard.label_business_name')}
                </Label>
                <Input 
                  value={formData.businessName} 
                  onChange={e => setFormData({...formData, businessName: e.target.value})}
                  className="bg-slate-900/50 border-white/10 text-white h-11 focus:border-amber-500/50 transition-all placeholder:text-slate-600"
                  placeholder="Ex: Barbearia Viking"
                />
              </div>
              
              <div>
                <Label className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5 block">
                    {t('wizard.label_whatsapp')}
                </Label>
                <Input 
                  value={formData.whatsapp} 
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000" 
                  maxLength={15} // (11) 99999-9999 = 15 chars
                  className={`bg-slate-900/50 border-white/10 text-white h-11 focus:border-amber-500/50 placeholder:text-slate-600 ${!isPhoneValid() && formData.whatsapp.length > 0 ? "border-red-500/50" : ""}`}
                />
                <div className="flex justify-between items-center mt-1.5">
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" /> 
                        {t('wizard.whatsapp_help')}
                    </p>
                    {/* Feedback visual de erro se digitar pouco */}
                    {!isPhoneValid() && formData.whatsapp.length > 3 && (
                        <span className="text-[10px] text-red-400 font-bold">Incompleto</span>
                    )}
                </div>
              </div>

              <div>
                <Label className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5 block">
                    {t('wizard.label_banner')}
                </Label>
                <div className="relative">
                  <Input 
                    value={formData.bannerUrl} 
                    onChange={e => setFormData({...formData, bannerUrl: e.target.value})}
                    placeholder="https://i.imgur.com/..." 
                    className={`bg-slate-900/50 text-white h-11 pr-10 placeholder:text-slate-600 ${formData.bannerUrl && !validateImage(formData.bannerUrl) ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-amber-500/50"}`}
                  />
                  <ImageIcon className="absolute right-3 top-3.5 w-4 h-4 text-slate-500" />
                </div>
                {formData.bannerUrl && !validateImage(formData.bannerUrl) ? (
                   <p className="text-xs text-red-400 mt-1.5 font-bold">{t('wizard.banner_error')}</p>
                ) : (
                   <p className="text-[10px] text-slate-500 mt-1.5">
                     {t('wizard.banner_tip')}
                   </p>
                )}
              </div>
            </div>

            {/* BOTÃO COM TRAVA DE SEGURANÇA */}
            <Button 
                onClick={saveStep1} 
                disabled={loading || !formData.businessName || !isPhoneValid()} 
                className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold h-12 rounded-xl shadow-lg border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : t('wizard.btn_next')}
            </Button>
          </div>
        );

      case 2: // SERVIÇO
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                <Scissors className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">{t('wizard.step2_title')}</h2>
              <p className="text-slate-400 text-sm mt-1">{t('wizard.step2_subtitle')}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('wizard.label_service_name')}</Label>
                <Input 
                  value={formData.serviceName}
                  onChange={e => setFormData({...formData, serviceName: e.target.value})}
                  className="bg-slate-900/50 border-white/10 text-white h-11 placeholder:text-slate-600"
                  placeholder="Ex: Corte Cabelo / Consulta"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('wizard.label_price')}</Label>
                  <Input 
                    type="number"
                    value={formData.servicePrice}
                    onChange={e => setFormData({...formData, servicePrice: e.target.value})}
                    className="bg-slate-900/50 border-white/10 text-white h-11 placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5 block">{t('wizard.label_duration')}</Label>
                  <Input 
                    type="number"
                    value={formData.serviceDuration}
                    onChange={e => setFormData({...formData, serviceDuration: e.target.value})}
                    className="bg-slate-900/50 border-white/10 text-white h-11 placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>
            <Button onClick={saveStep2} disabled={loading || !formData.serviceName} className="w-full mt-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold h-12 rounded-xl border-0 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : t('wizard.btn_create_service')}
            </Button>
          </div>
        );

      case 3: // HORÁRIOS
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">{t('wizard.step3_title')}</h2>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">{t('wizard.step3_subtitle')}</p>
            </div>

            <div className="bg-slate-900/50 p-5 rounded-xl border border-white/10 flex items-center justify-between transition-colors hover:border-white/20">
              <div>
                <p className="font-bold text-white text-sm">{t('wizard.standard_hours')}</p>
                <p className="text-slate-400 text-xs mt-1">{t('wizard.standard_hours_desc')}</p>
              </div>
              <Switch 
                checked={formData.useStandardHours}
                onCheckedChange={checked => setFormData({...formData, useStandardHours: checked})}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 items-start">
                 <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                 <p className="text-blue-200 text-xs leading-relaxed">
                   {t('wizard.manual_warning')}
                 </p>
            </div>

            <Button onClick={saveStep3} disabled={loading} className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold h-12 rounded-xl border-0">
              {loading ? <Loader2 className="animate-spin" /> : t('wizard.btn_confirm_hours')}
            </Button>
          </div>
        );

      case 4: // LINK
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
             <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                <Share2 className="w-8 h-8 text-slate-900" />
              </div>
              <h2 className="text-2xl font-bold text-white">{t('wizard.step4_title')}</h2>
              <p className="text-slate-400 text-sm mt-1">{t('wizard.step4_subtitle')}</p>
            </div>

            <div className="p-5 bg-black/40 border border-white/10 rounded-xl text-center break-all relative group">
               <p className="text-xs text-slate-400 mb-2 uppercase tracking-widest">{t('wizard.your_link')}</p>
               <p className="font-mono text-xl text-amber-400 font-bold tracking-tight">
                 cleverya.com/{formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}
               </p>
               <Button variant="ghost" size="sm" className="absolute right-2 top-2 text-white/30 hover:text-white hover:bg-white/10" onClick={copyLink}>
                 <Copy className="w-4 h-4" />
               </Button>
            </div>

            <Button onClick={() => setStep(5)} className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white font-bold h-12 rounded-xl border-0">
                {t('wizard.btn_copied')}
            </Button>
          </div>
        );

      case 5: // FINAL
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">{t('wizard.step5_title')}</h2>
              <p className="text-slate-400 text-sm mt-1">{t('wizard.step5_subtitle')}</p>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/20 p-5 rounded-xl text-sm text-cyan-200 space-y-3">
               <p className="flex items-center gap-2 font-medium">{t('wizard.install_1')}</p>
               <p className="flex items-center gap-2 font-medium">{t('wizard.install_2')}</p>
               <p className="flex items-center gap-2 font-medium">{t('wizard.install_3')}</p>
            </div>

            <Button onClick={handleClose} className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold h-12 rounded-xl shadow-lg border-0">
              {t('wizard.btn_finish')}
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden bg-[#0f172a] border border-white/10 text-white shadow-2xl">
        
        <div className="h-1 bg-slate-800 w-full flex">
           <div 
             className="h-full bg-gradient-to-r from-amber-400 to-orange-600 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-500 ease-out" 
             style={{ width: `${(step / 5) * 100}%` }}
           ></div>
        </div>

        <div className="p-8">
           {renderStep()}
        </div>

        <div className="bg-[#020617]/50 p-4 text-center text-[10px] text-slate-500 border-t border-white/5 uppercase tracking-widest font-medium">
           Passo {step} de 5 • Cleverya Setup
        </div>

      </DialogContent>
    </Dialog>
  );
}