import { Link } from 'react-router-dom';
import { 
  Calendar, CheckCircle, Clock, DollarSign, 
  Menu, X, Star, AlertCircle, Smartphone,
  Briefcase, Brain, Scissors, Dumbbell,
  TrendingUp, Bell, Share2, MousePointerClick,
  XCircle 
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setIsMenuOpen(false); 
  };

  const nichesCards = [
    { 
      icon: Scissors, 
      title: t('landing.niches.barber_title'), 
      desc: t('landing.niches.barber_desc'),
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20"
    },
    { 
      icon: Brain, 
      title: t('landing.niches.health_title'), 
      desc: t('landing.niches.health_desc'),
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20"
    },
    { 
      icon: Dumbbell, 
      title: t('landing.niches.trainer_title'), 
      desc: t('landing.niches.trainer_desc'),
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20"
    },
    { 
      icon: Briefcase, 
      title: t('landing.niches.consultant_title'), 
      desc: t('landing.niches.consultant_desc'),
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-primary selection:text-slate-950 overflow-x-hidden">
      
      {/* --- HEADER --- */}
      <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* LADO ESQUERDO: LOGO */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                <Star className="w-5 h-5 text-slate-950 fill-slate-950" />
              </div>
              <span className="font-bold text-xl tracking-tight">Cleverya</span>
            </div>
            
            {/* LADO DIREITO: LINKS (Desktop) + IDIOMA (Todos) + MENU (Mobile) */}
            <div className="flex items-center gap-4 md:gap-8">
              
              {/* LINKS DESKTOP (Escondidos no Mobile) */}
              <div className="hidden md:flex items-center gap-8">
                <button onClick={() => scrollToSection('como-funciona')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  {t('landing.nav.how')}
                </button>
                <button onClick={() => scrollToSection('beneficios')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  {t('landing.nav.benefits')}
                </button>
                <button onClick={() => scrollToSection('planos')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  {t('landing.nav.plans')}
                </button>
              </div>

              {/* SELETOR DE IDIOMA (VISÍVEL SEMPRE) */}
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <button 
                  onClick={() => changeLanguage('pt')} 
                  className={`text-xs font-bold transition-colors ${i18n.language.includes('pt') ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                >
                  PT
                </button>
                <span className="text-gray-700 text-xs">|</span>
                <button 
                  onClick={() => changeLanguage('en')} 
                  className={`text-xs font-bold transition-colors ${i18n.language.includes('en') ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                >
                  EN
                </button>
              </div>

              {/* BOTÕES DE AÇÃO (Desktop Only) */}
              <div className="hidden md:flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-white hover:text-primary transition-colors">
                  {t('landing.nav.login')}
                </Link>
                <Link to="/signup">
                  <button className="bg-primary hover:bg-primary/90 text-slate-950 px-5 py-2 rounded-full font-bold text-sm transition-all shadow-[0_0_15px_rgba(250,204,21,0.3)] hover:shadow-[0_0_25px_rgba(250,204,21,0.5)]">
                    {t('landing.nav.start')}
                  </button>
                </Link>
              </div>

              {/* BOTÃO HAMBURGUER (Mobile Only) */}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-gray-300 p-1">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
        
        {/* MOBILE MENU DROPDOWN */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-white/10 shadow-2xl absolute w-full left-0 z-40">
            <div className="px-4 pt-4 pb-6 space-y-3">
              <button onClick={() => scrollToSection('como-funciona')} className="block w-full text-left px-4 py-3 text-gray-300 hover:bg-white/5 rounded-lg font-medium">{t('landing.nav.how')}</button>
              <button onClick={() => scrollToSection('planos')} className="block w-full text-left px-4 py-3 text-gray-300 hover:bg-white/5 rounded-lg font-medium">{t('landing.nav.plans')}</button>
              
              <div className="border-t border-white/10 my-2 pt-2"></div>

              <Link to="/login" className="block w-full px-4 py-3 text-gray-300 hover:text-white text-center font-medium">{t('landing.nav.login')}</Link>
              <Link to="/signup" className="block w-full">
                <button className="w-full bg-primary text-slate-900 py-3 rounded-xl font-bold text-center">
                  {t('landing.nav.start')}
                </button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-50" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {t('landing.hero.badge')}
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight"
          >
            {t('landing.hero.title_1')} <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-200">
              {t('landing.hero.title_highlight')}
            </span> {t('landing.hero.title_2')}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10"
          >
            {t('landing.hero.subtitle')}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            <Link to="/signup">
              <button className="bg-primary hover:bg-primary/90 text-slate-950 text-lg px-8 py-4 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] flex items-center gap-2">
                👉 {t('landing.hero.cta')}
              </button>
            </Link>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" /> {t('landing.hero.micro')}
            </p>
          </motion.div>

          {/* VISUAL MOCKUP HERO */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-16 relative mx-auto max-w-5xl"
          >
             {/* CARD FLUTUANTE 1: Novo Agendamento */}
             <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
               className="absolute -top-6 -left-4 md:-left-12 z-20 bg-slate-800 p-4 rounded-xl border border-white/10 shadow-2xl flex items-center gap-4 max-w-[200px] md:max-w-none"
             >
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                   <Bell className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-left">
                   <p className="text-xs text-gray-400 font-bold">{t('landing.floating.new_app')}</p>
                   <p className="text-sm text-white font-bold">{t('landing.floating.confirmed')} ✅</p>
                </div>
             </motion.div>

             {/* CARD FLUTUANTE 2: Receita Semana */}
             <motion.div 
               animate={{ y: [0, 10, 0] }}
               transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
               className="absolute -bottom-6 -right-4 md:-right-8 z-20 bg-slate-800 p-4 rounded-xl border border-white/10 shadow-2xl flex items-center gap-4"
             >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                   <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                   <p className="text-xs text-gray-400 font-bold">{t('landing.floating.revenue_week')}</p>
                   <p className="text-lg text-white font-bold text-primary">+ R$ 5.450,00</p>
                </div>
             </motion.div>

             {/* IMAGEM PRINCIPAL */}
             <div className="rounded-xl border border-white/10 shadow-2xl overflow-hidden bg-slate-900 relative z-10">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none"></div>
                <img 
                  src="/dashboard-print.png" 
                  alt="Painel Cleverya" 
                  className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    e.currentTarget.src = "https://bxglxltapbagjmmkagfm.supabase.co/storage/v1/object/public/public-assets/dashboard-print.jpg";
                  }}
                />
             </div>
          </motion.div>
        </div>
      </section>

      {/* --- SEÇÃO DE NICHOS --- */}
      <section className="py-20 bg-slate-950 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-bold uppercase tracking-wider text-sm">{t('landing.versatility.badge')}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">
              {t('landing.versatility.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">{t('landing.versatility.title_highlight')}</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
              {t('landing.versatility.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {nichesCards.map((niche, index) => (
              <motion.div 
                key={index}
                whileHover={{ y: -10 }}
                className={`p-8 rounded-3xl border transition-all ${niche.bg} ${niche.border} hover:bg-opacity-20 flex flex-col items-center text-center`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-slate-950 shadow-inner`}>
                   <niche.icon className={`w-8 h-8 ${niche.color}`} />
                </div>
                <h3 className="font-bold text-xl text-white mb-3">{niche.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{niche.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SEÇÃO DE DOR --- */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-red-400 font-bold uppercase tracking-wider text-sm">{t('landing.pain.badge')}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">
              {t('landing.pain.title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Smartphone, text: t('landing.pain.item_1'), color: "text-red-400" }, 
              { icon: AlertCircle, text: t('landing.pain.item_2'), color: "text-orange-400" }, 
              { icon: Clock, text: t('landing.pain.item_3'), color: "text-yellow-400" }, 
              { icon: DollarSign, text: t('landing.pain.item_4'), color: "text-rose-400" }, 
            ].map((item, index) => (
              <motion.div 
                key={index}
                whileHover={{ y: -5 }}
                className="bg-slate-950 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
              >
                <item.icon className={`w-10 h-10 ${item.color} mb-4`} />
                <p className="font-medium text-gray-300 text-lg">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SEÇÃO COMO FUNCIONA (RESTAURADA) --- */}
      <section id="como-funciona" className="py-20 bg-slate-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">{t('landing.how.title')}</h2>
            <p className="text-gray-400 mt-2">{t('landing.how.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Linha conectora (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-10" />

            {/* Passo 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(250,204,21,0.1)] relative z-10">
                <span className="text-4xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('landing.how.step_1_title')}</h3>
              <p className="text-gray-400 text-sm max-w-xs">{t('landing.how.step_1_desc')}</p>
            </div>

            {/* Passo 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(250,204,21,0.1)] relative z-10">
                <Share2 className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('landing.how.step_2_title')}</h3>
              <p className="text-gray-400 text-sm max-w-xs">{t('landing.how.step_2_desc')}</p>
            </div>

            {/* Passo 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(250,204,21,0.1)] relative z-10">
                <MousePointerClick className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('landing.how.step_3_title')}</h3>
              <p className="text-gray-400 text-sm max-w-xs">{t('landing.how.step_3_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- BENEFÍCIOS --- */}
      <section id="beneficios" className="py-20 bg-slate-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">{t('landing.benefits.title_1')} <span className="text-primary">{t('landing.benefits.title_highlight')}</span></h2>
              <div className="space-y-4">
                {[
                  t('landing.benefits.item_1'),
                  t('landing.benefits.item_2'),
                  t('landing.benefits.item_3'),
                  t('landing.benefits.item_4')
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="min-w-[24px] min-h-[24px] rounded-full bg-primary/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
               <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl blur-3xl opacity-20" />
               <div className="bg-slate-900 border border-white/10 rounded-2xl p-2 relative shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                  <img 
                    src="/finance-card.png" 
                    alt="Controle Financeiro Cleverya" 
                    className="w-full h-auto rounded-xl shadow-inner"
                    onError={(e) => {
                      e.currentTarget.src = "https://bxglxltapbagjmmkagfm.supabase.co/storage/v1/object/public/public-assets/finance-card.jpg";
                    }}
                  />
               </div>

               {/* CARD FLUTUANTE 1: Novo Agendamento (Para ter 2 por imagem) */}
               <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                 className="absolute -top-6 -left-4 md:-left-12 z-20 bg-slate-800 p-4 rounded-xl border border-white/10 shadow-2xl flex items-center gap-4 max-w-[200px] md:max-w-none"
               >
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                     <Bell className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-left">
                     <p className="text-xs text-gray-400 font-bold">{t('landing.floating.new_app')}</p>
                     <p className="text-sm text-white font-bold">{t('landing.floating.confirmed')} ✅</p>
                  </div>
               </motion.div>

               {/* CARD FLUTUANTE 2: Receita Hoje */}
               <motion.div 
                 animate={{ y: [0, 10, 0] }}
                 transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                 className="absolute -bottom-6 -right-4 md:-right-8 z-20 bg-slate-800 p-4 rounded-xl border border-white/10 shadow-2xl flex items-center gap-4"
               >
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                     <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-left">
                     <p className="text-xs text-gray-400 font-bold">{t('landing.floating.revenue_today')}</p>
                     <p className="text-lg font-bold text-green-400">+ R$ 450,00</p>
                  </div>
               </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* --- PLANOS --- */}
      <section id="planos" className="py-20 bg-slate-900 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">{t('landing.plans.title')}</h2>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
              {t('landing.plans.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            
            {/* Plano Grátis */}
            <div className="bg-slate-950 p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-500 to-white/20" />
              <h3 className="text-xl font-bold text-white">{t('landing.plans.free.title')}</h3>
              <div className="mt-4 mb-2">
                <span className="text-4xl font-bold text-white">R$ 0</span>
                <span className="text-gray-400">{t('landing.plans.per_month')}</span>
              </div>
              <p className="text-sm text-gray-400 mb-6 font-medium">{t('landing.plans.free.desc')}</p>
              
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-sm text-gray-300 font-medium">
                  <CheckCircle className="w-4 h-4 text-green-500" /> {t('landing.plans.free.item_1')}
                </li>
              </ul>
              <Link to="/signup">
                <button className="w-full py-3 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-all">
                  {t('landing.plans.free.cta')}
                </button>
              </Link>
            </div>

            {/* Plano PRO */}
            <div className="bg-slate-800 p-8 rounded-2xl border-2 border-primary relative transform md:-translate-y-4 shadow-[0_0_30px_rgba(250,204,21,0.15)] flex flex-col">
              <div className="absolute top-0 right-0 bg-primary text-slate-950 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                {t('landing.plans.pro.badge')}
              </div>
              <h3 className="text-xl font-bold text-white">{t('landing.plans.pro.title')}</h3>
              <div className="mt-4 mb-2">
                <span className="text-4xl font-bold text-white">R$ 29,90</span>
                <span className="text-gray-400">{t('landing.plans.per_month')}</span>
              </div>
              <p className="text-sm text-gray-400 mb-6 font-medium">{t('landing.plans.pro.desc')}</p>

              {/* ATUALIZADO: LINK DO PLANO PRO COM PARÂMETROS */}
              <Link to="/signup?plan=pro&cycle=monthly">
                <button className="w-full mt-auto py-3 rounded-xl bg-primary text-slate-950 font-bold hover:bg-primary/90 transition-all shadow-lg">
                  {t('landing.plans.pro.cta')}
                </button>
              </Link>
            </div>

            {/* Plano Business */}
            <div className="bg-slate-950 p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex flex-col">
              <h3 className="text-xl font-bold text-white">{t('landing.plans.business.title')}</h3>
              <div className="mt-4 mb-2">
                <span className="text-4xl font-bold text-white">R$ 59,90</span>
                <span className="text-gray-400">{t('landing.plans.per_month')}</span>
              </div>
              <p className="text-sm text-gray-400 mb-6 font-medium">{t('landing.plans.business.desc')}</p>
              
              {/* ATUALIZADO: LINK DO PLANO BUSINESS COM PARÂMETROS */}
              <Link to="/signup?plan=business&cycle=monthly">
                <button className="w-full mt-auto py-3 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-all">
                  {t('landing.plans.business.cta')}
                </button>
              </Link>
            </div>
          </div>

          {/* Comparativo Rápido */}
          <div className="max-w-3xl mx-auto bg-slate-950 rounded-xl border border-white/10 p-6">
            <h4 className="text-center font-bold text-white mb-6">{t('landing.plans.compare.title')}</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="col-span-1 text-gray-400 font-medium flex items-center">{t('landing.plans.compare.feature')}</div>
              {/* ATUALIZADO: TRADUÇÃO DE (TODOS) */}
              <div className="col-span-1 text-center font-bold text-primary">Cleverya ({t('landing.plans.compare.all')})</div>
              <div className="col-span-1 text-center text-gray-500">{t('landing.plans.compare.others')}</div>

              <div className="col-span-3 h-px bg-white/5 my-1" />
              
              <div className="col-span-1 text-gray-300">Link 24h</div>
              <div className="col-span-1 text-center text-primary"><CheckCircle className="w-4 h-4 mx-auto" /></div>
              <div className="col-span-1 text-center text-gray-600"><XCircle className="w-4 h-4 mx-auto" /></div>

              <div className="col-span-3 h-px bg-white/5 my-1" />

              <div className="col-span-1 text-gray-300">{t('landing.benefits.item_2')}</div>
              <div className="col-span-1 text-center text-primary"><CheckCircle className="w-4 h-4 mx-auto" /></div>
              <div className="col-span-1 text-center text-gray-600 text-xs md:text-sm">{t('landing.plans.compare.charged_separately')}</div>
            </div>
          </div>

        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 -z-10" />
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            {t('landing.cta_final.title')}
          </h2>
          <Link to="/signup">
            <button className="bg-primary hover:bg-primary/90 text-slate-950 text-xl px-10 py-5 rounded-full font-bold transition-all shadow-[0_0_30px_rgba(250,204,21,0.5)] hover:scale-105 transform duration-200">
              👉 {t('landing.cta_final.btn')}
            </button>
          </Link>
          <p className="mt-6 text-gray-400">
            {t('landing.cta_final.subtitle')}
          </p>
        </div>
      </section>

      {/* --- FOOTER (RODAPÉ) --- */}
      <footer className="bg-slate-950 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Logo e Copyright */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Star className="w-3 h-3 text-slate-950 fill-slate-950" />
              </div>
              <span className="font-bold text-lg">Cleverya</span>
            </div>
            <div className="text-gray-500 text-sm hidden md:block">|</div>
            <div className="text-gray-500 text-sm">
              {t('landing.footer.copy')}
            </div>
          </div>

          <div className="flex gap-6">
            {/* Link para Termos */}
            <Link to="/terms" className="text-gray-500 hover:text-white transition-colors text-sm">
              {t('landing.footer.terms')}
            </Link>
            
            {/* Link para Privacidade */}
            <Link to="/privacy" className="text-gray-500 hover:text-white transition-colors text-sm">
              {t('landing.footer.privacy')}
            </Link>
            
            {/* Link para Instagram */}
            <a 
              href="https://www.instagram.com/cleverya.app" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-500 hover:text-white transition-colors text-sm"
            >
              {t('landing.footer.instagram')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}