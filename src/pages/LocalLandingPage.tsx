import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { CheckCircle, MapPin, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export default function LocalLandingPage() {
  const { profession, city } = useParams();
  const { i18n } = useTranslation();

  // 1. DETECÇÃO DE IDIOMA PELA URL
  // Se a profissão na URL for um termo em inglês, forçamos o modo EN.
  const englishTerms = ['barber', 'psychologist', 'trainer', 'nail-salon', 'dentist', 'therapist'];
  const urlTerm = profession?.toLowerCase() || '';
  const forceEnglish = englishTerms.includes(urlTerm);

  // Define se vamos mostrar conteúdo em PT ou EN
  const isPT = !forceEnglish; 

  // Efeito colateral: Muda o idioma do i18n para os componentes internos (Header, Footer) também ficarem certos
  useEffect(() => {
    if (forceEnglish && i18n.language.startsWith('pt')) {
      i18n.changeLanguage('en');
    } else if (!forceEnglish && i18n.language.startsWith('en')) {
      i18n.changeLanguage('pt');
    }
  }, [forceEnglish, i18n]);

  // Função auxiliar para formatar texto
  const formatText = (text: string | undefined) => {
    if (!text) return '';
    return text.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const cityDisplay = formatText(city);
  
  // Dicionário de Conteúdo (PT e EN)
  // Mapeamos tanto as chaves em PT quanto as chaves em EN para o mesmo conteúdo
  const contentMap: Record<string, any> = {
    // --- BARBEARIA / BARBER ---
    'barbearia': {
      pt: { title: 'Sistema para Barbearias', pain: 'Cansado de clientes furando horário?', benefit: 'Reduza o No-Show com lembretes automáticos.' },
      en: { title: 'Software for Barbershops', pain: 'Tired of client no-shows?', benefit: 'Reduce missed appointments with auto reminders.' }
    },
    'barber': { // Alias para inglês
      pt: { title: 'Sistema para Barbearias', pain: 'Cansado de clientes furando horário?', benefit: 'Reduza o No-Show com lembretes automáticos.' },
      en: { title: 'Software for Barbershops', pain: 'Tired of client no-shows?', benefit: 'Reduce missed appointments with auto reminders.' }
    },

    // --- MANICURE / NAIL SALON ---
    'manicure': {
      pt: { title: 'Agenda para Manicures', pain: 'Perdendo tempo respondendo WhatsApp?', benefit: 'Deixe a cliente agendar sozinha.' },
      en: { title: 'Nail Salon Scheduling', pain: 'Wasting time replying to DMs?', benefit: 'Let clients book themselves 24/7.' }
    },
    'nail-salon': {
      pt: { title: 'Agenda para Manicures', pain: 'Perdendo tempo respondendo WhatsApp?', benefit: 'Deixe a cliente agendar sozinha.' },
      en: { title: 'Nail Salon Scheduling', pain: 'Wasting time replying to DMs?', benefit: 'Let clients book themselves 24/7.' }
    },

    // --- PSICÓLOGO / PSYCHOLOGIST ---
    'psicologo': {
      pt: { title: 'Software para Psicólogos', pain: 'Precisa de prontuário seguro?', benefit: 'Gestão de pacientes com total sigilo.' },
      en: { title: 'Software for Psychologists', pain: 'Need secure patient records?', benefit: 'Patient management with total privacy.' }
    },
    'psychologist': {
      pt: { title: 'Software para Psicólogos', pain: 'Precisa de prontuário seguro?', benefit: 'Gestão de pacientes com total sigilo.' },
      en: { title: 'Software for Psychologists', pain: 'Need secure patient records?', benefit: 'Patient management with total privacy.' }
    },

    // --- PERSONAL / TRAINER ---
    'personal-trainer': {
      pt: { title: 'App para Personal Trainer', pain: 'Gerencie alunos e pagamentos.', benefit: 'Foque no treino, não na cobrança.' },
      en: { title: 'App for Personal Trainers', pain: 'Manage students and payments.', benefit: 'Focus on training, not billing.' }
    },
    'trainer': {
      pt: { title: 'App para Personal Trainer', pain: 'Gerencie alunos e pagamentos.', benefit: 'Foque no treino, não na cobrança.' },
      en: { title: 'App for Personal Trainers', pain: 'Manage students and payments.', benefit: 'Focus on training, not billing.' }
    },

    'default': {
      pt: { title: 'Agendamento Online', pain: 'Organize sua agenda e fature mais.', benefit: 'O sistema completo para prestadores de serviço.' },
      en: { title: 'Online Booking System', pain: 'Organize your schedule and earn more.', benefit: 'The complete system for service providers.' }
    }
  };

  // Seleciona o conteúdo
  const selectedContent = contentMap[urlTerm] || contentMap['default'];
  const content = isPT ? selectedContent.pt : selectedContent.en;
  
  const professionDisplay = urlTerm === 'default' 
    ? (isPT ? 'Profissionais' : 'Professionals') 
    : formatText(profession);

  // Textos da Interface (Hardcoded para performance, já que só temos 2 línguas aqui)
  const ui = {
    attending: isPT ? 'Atendendo' : 'Serving',
    region: isPT ? 'e região' : 'area',
    best_app: isPT ? 'A melhor agenda para' : 'The best scheduling app for',
    in: isPT ? 'em' : 'in',
    cta_start: isPT ? 'Começar Grátis' : 'Start Free',
    cta_features: isPT ? 'Ver Funcionalidades' : 'See Features',
    why: isPT ? 'Por que' : 'Why do',
    choose: isPT ? 'escolhem o Cleverya?' : 'choose Cleverya?',
    card1_title: isPT ? 'Link de Agendamento' : 'Booking Link',
    card1_desc: isPT ? 'Seus clientes marcam horário sozinhos pelo link na Bio.' : 'Clients book themselves via your Bio link.',
    card2_title: isPT ? 'Lembretes Automáticos' : 'Auto Reminders',
    card2_desc: isPT ? 'O sistema envia mensagem no WhatsApp para confirmar.' : 'System sends WhatsApp/Email reminders to reduce no-shows.',
    card3_title: isPT ? 'Gestão Financeira' : 'Financial Management',
    card3_desc: isPT ? 'Saiba exatamente quanto faturou no dia.' : 'Know exactly how much you earned today.',
    create_account: isPT ? 'Criar minha conta agora' : 'Create free account now'
  };

  const scrollToFeatures = () => {
    const element = document.getElementById('features');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-amber-500/30">
      <Helmet>
        <title>{`${content.title} ${ui.in} ${cityDisplay} | Cleverya`}</title>
        <meta name="description" content={`${content.title} ${ui.in} ${cityDisplay}. ${content.benefit}`} />
        {/* Canonical Link ajuda o Google a entender que é a mesma página */}
        <link rel="canonical" href={`https://cleverya.com/solucoes/${profession}/${city}`} />
      </Helmet>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-amber-500/20 animate-fade-in">
          <MapPin className="w-4 h-4" />
          <span>{ui.attending} {cityDisplay} {ui.region}</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight">
          {ui.best_app} <span className="text-amber-500">{professionDisplay}</span> {ui.in} {cityDisplay}
        </h1>

        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          {content.pain} {content.benefit}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
             className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold h-12 px-8 rounded-xl text-base shadow-lg hover:shadow-amber-500/20 transition-all transform hover:-translate-y-1"
             onClick={() => window.location.href = '/signup'}
          >
            {ui.cta_start}
          </Button>
          
          <Button 
            variant="outline" 
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white h-12 px-8 rounded-xl text-base"
            onClick={scrollToFeatures}
          >
            {ui.cta_features}
          </Button>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="bg-slate-800/30 py-20 border-t border-white/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {ui.why} {professionDisplay} {ui.in} {cityDisplay} {ui.choose}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard title={ui.card1_title} desc={ui.card1_desc} cta={ui.create_account} />
            <FeatureCard title={ui.card2_title} desc={ui.card2_desc} cta={ui.create_account} />
            <FeatureCard title={ui.card3_title} desc={ui.card3_desc} cta={ui.create_account} />
          </div>

          <div className="mt-12 text-center">
            <Button 
              variant="link" 
              className="text-amber-500 hover:text-amber-400 gap-2 text-lg"
              onClick={() => window.location.href = '/signup'}
            >
              {ui.create_account} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, cta }: { title: string, desc: string, cta: string }) {
  return (
    <div 
      onClick={() => window.location.href = '/signup'}
      className="bg-slate-900/50 p-8 rounded-2xl border border-white/5 hover:border-amber-500/50 transition-all hover:bg-slate-800/80 group cursor-pointer shadow-lg hover:shadow-amber-500/10 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />

      <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
        <CheckCircle className="w-6 h-6 text-amber-500 group-hover:text-amber-400" />
      </div>
      
      <h3 className="text-xl font-bold mb-3 text-white group-hover:text-amber-400 transition-colors">{title}</h3>
      <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">{desc}</p>

      <div className="mt-4 flex items-center text-amber-500 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
        {cta} <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  );
}