import { Link } from 'react-router-dom';
import { 
  CheckCircle, Clock, DollarSign, 
  Menu, X, Star, Smartphone,
  Sparkles, ShieldCheck, CalendarCheck,
  TrendingUp, Bell, Users, Quote, ChevronDown, CheckCircle2, Zap, Crown, Building2
} from 'lucide-react';
import { useState } from 'react';
import { m, LazyMotion, domAnimation } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function EsteticaLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { i18n } = useTranslation(); 
  
  const isPT = i18n.language?.startsWith('pt') || true;
  const currencySymbol = isPT ? 'R$' : '$';
  const pricePro = isPT ? '29,90' : '9.90';
  const priceBiz = isPT ? '59,90' : '19.90';

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const toggleFaq = (index: number) => {
    if (openFaq === index) setOpenFaq(null);
    else setOpenFaq(index);
  };

  const faqs = [
    {
      q: "As clientes não vão achar ruim pagar o sinal antecipado?",
      a: "Pelo contrário! Clínicas de alto padrão já fazem isso. O pagamento do sinal filtra as clientes curiosas e garante que apenas quem realmente valoriza o seu trabalho faça o agendamento. É a valorização do seu tempo."
    },
    {
      q: "Para onde vai o dinheiro do sinal via PIX?",
      a: "O Cleverya integra diretamente com o seu Mercado Pago. O dinheiro do sinal cai instantaneamente e diretamente na sua conta, de forma segura e automática."
    },
    {
      q: "É difícil de configurar? Não entendo muito de tecnologia.",
      a: "Criamos o Cleverya para ser a plataforma mais simples do mercado. Em menos de 5 minutos você cadastra os seus serviços, liga o seu Mercado Pago e já tem o seu link de agendamento pronto para colocar na Bio do Instagram."
    },
    {
      q: "Funciona se eu trabalhar sozinha ou se tiver equipe?",
      a: "Ambos! Se você trabalha sozinha, o sistema bloqueia horários automaticamente para não encavalar. Se tem equipe, pode adicionar as profissionais e o cliente escolhe com quem quer ser atendido."
    },
    {
      q: "Tenho de colocar o cartão de crédito para testar?",
      a: "Absolutamente não! Assim que você cria a conta, nós ativamos automaticamente 30 dias grátis do plano PRO para você testar a cobrança de sinal. Tudo isso sem pedir os dados do seu cartão. O nosso compromisso é provar o resultado primeiro."
    }
  ];

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-[#0a0f1c] text-white font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
        
        {/* 1. NAV */}
        <nav className="fixed w-full z-50 bg-[#0a0f1c]/90 backdrop-blur-md border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                  <Star className="w-5 h-5 text-slate-950 fill-slate-950" />
                </div>
                <span className="font-bold text-xl tracking-tight">Cleverya</span>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/login" className="hidden md:block text-sm font-medium text-gray-300 hover:text-amber-400 transition-colors">
                  Entrar
                </Link>
                <Link to="/signup">
                  <button className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-amber-500/25">
                    Testar Grátis
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* 2. HERO */}
        <section className="pt-32 pb-16 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] -z-10" />
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400 mb-6 uppercase tracking-widest shadow-sm">
              <Sparkles className="w-3 h-3" /> Para Clínicas de Estética, Cílios e Bronzeamento
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Lotar a agenda é ótimo. Garantir o <br className="hidden md:block"/>
              pagamento é <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">melhor ainda.</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Acabe com os "furos" das clientes cobrando um Sinal via PIX no momento da reserva. O seu cliente agenda sozinho pelo Instagram e o seu faturamento fica 100% previsível.
            </p>

            <div className="flex flex-col items-center gap-4">
              <Link to="/signup">
                <button className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 text-xl px-10 py-4 rounded-full font-bold transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Acabar com as faltas agora
                </button>
              </Link>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-xs text-green-400 font-bold flex items-center gap-1.5 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                  <CheckCircle className="w-3 h-3" /> 30 dias de Premium grátis
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" /> Sem cartão de crédito
                </p>
              </div>
            </div>

            {/* MOCKUP VISUAL */}
            <div className="mt-16 relative mx-auto max-w-4xl">
              <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-slate-900">
                  <img src="/dashboard-print.webp" alt="Painel Cleverya" className="w-full h-auto object-cover opacity-90" />
              </m.div>
              <m.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute -top-6 -left-4 md:-left-8 z-20 bg-slate-800 p-4 rounded-xl border border-amber-500/30 shadow-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-500" /></div>
                  <div className="text-left"><p className="text-xs text-gray-400 font-bold">Sinal via PIX Recebido</p><p className="text-sm text-white font-bold">+ R$ 150,00 ✅</p></div>
              </m.div>
            </div>
          </div>
        </section>

        {/* 3. LOGOS / SOCIAL PROOF ("Usada por X profissionais") */}
        <section className="py-10 border-y border-white/5 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">
              O sistema oficial de profissionais de estética de alto padrão
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale">
               {/* Substitua por logos reais se tiver, ou ícones representativos */}
               <div className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-6 h-6"/> Lash Studios</div>
               <div className="text-xl font-bold flex items-center gap-2"><Star className="w-6 h-6"/> Clínicas de Estética</div>
               <div className="text-xl font-bold flex items-center gap-2"><Users className="w-6 h-6"/> Espaços de Bronze</div>
               <div className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6"/> Sobrancelhas Elite</div>
            </div>
          </div>
        </section>

        {/* 3. DOR E PROBLEMA */}
        <section className="py-24 bg-slate-900 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Você perde dinheiro todas as semanas e nem percebe.</h2>
                <p className="text-gray-400 mt-4 max-w-2xl mx-auto">O modelo de agendar "de boca" no WhatsApp está travando o crescimento do seu espaço.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-[#0a0f1c] p-8 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group">
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><CalendarCheck className="w-6 h-6 text-red-500" /></div>
                  <h3 className="text-xl font-bold text-white mb-3">O Buraco na Agenda</h3>
                  <p className="text-gray-400 leading-relaxed">A cliente agenda, você prepara os produtos, recusa outras pessoas e ela simplesmente não aparece. Prejuízo direto no seu caixa.</p>
                </div>
                <div className="bg-[#0a0f1c] p-8 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all group">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Clock className="w-6 h-6 text-amber-500" /></div>
                  <h3 className="text-xl font-bold text-white mb-3">O Tempo Perdido</h3>
                  <p className="text-gray-400 leading-relaxed">Ter de parar um atendimento no meio para responder "tem horário amanhã?" e acabar perdendo a venda porque demorou a responder.</p>
                </div>
                <div className="bg-[#0a0f1c] p-8 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><TrendingUp className="w-6 h-6 text-blue-500" /></div>
                  <h3 className="text-xl font-bold text-white mb-3">Desorganização</h3>
                  <p className="text-gray-400 leading-relaxed">Não saber exatamente quanto dinheiro entrou hoje ou quanto tem a receber no fim do mês porque anota tudo no caderno.</p>
                </div>
              </div>
          </div>
        </section>

         {/* 5. COMO FUNCIONA (3 passos simples) */}
        <section className="py-24 bg-slate-900 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-amber-500 font-bold uppercase tracking-wider text-sm">O SEU PILOTO AUTOMÁTICO</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Como a Cleverya vai transformar a sua rotina</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12 relative">
                <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent -z-10" />
                
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-24 h-24 bg-slate-950 border border-amber-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(245,158,11,0.15)] text-3xl font-black text-amber-500">1</div>
                  <h3 className="text-xl font-bold text-white mb-3">Configure a sua Vitrine</h3>
                  <p className="text-gray-400">Em 5 minutos, adicione os seus serviços, preços e ligue o seu Mercado Pago. Copie o seu Link Premium e coloque na Bio do Instagram.</p>
                </div>
                
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-24 h-24 bg-slate-950 border border-amber-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(245,158,11,0.15)]"><Smartphone className="w-10 h-10 text-amber-500" /></div>
                  <h3 className="text-xl font-bold text-white mb-3">O Cliente Escolhe e Paga</h3>
                  <p className="text-gray-400">O cliente clica, vê os seus horários livres, escolhe e faz o PIX do Sinal para garantir a vaga. Tudo sozinho, sem trocar mensagens consigo.</p>
                </div>

                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-24 h-24 bg-slate-950 border border-amber-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(245,158,11,0.15)]"><CheckCircle2 className="w-10 h-10 text-amber-500" /></div>
                  <h3 className="text-xl font-bold text-white mb-3">Você Foca no Atendimento</h3>
                  <p className="text-gray-400">Você só recebe a notificação do dinheiro na conta e do horário agendado. O sistema encarrega-se do resto.</p>
                </div>
            </div>
          </div>
        </section>

        {/* 4. BENEFÍCIOS E SOLUÇÃO */}
        <section className="py-24 bg-[#0a0f1c]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Mais que uma agenda. <br/><span className="text-amber-500">O seu gerente financeiro.</span></h2>
                <div className="space-y-8">
                  <div className="flex gap-4">
                      <div className="mt-1 bg-amber-500/10 p-2 rounded-lg h-fit"><ShieldCheck className="w-6 h-6 text-amber-500" /></div>
                      <div>
                          <h4 className="text-xl font-bold text-white mb-1">Proteção Anti-Faltas (Sinal Obrigatório)</h4>
                          <p className="text-gray-400">Configure os seus serviços para cobrar 50% antecipado. Clientes que pagam sinal não faltam. A sua receita torna-se garantida.</p>
                      </div>
                  </div>
                  <div className="flex gap-4">
                      <div className="mt-1 bg-amber-500/10 p-2 rounded-lg h-fit"><Sparkles className="w-6 h-6 text-amber-500" /></div>
                      <div>
                          <h4 className="text-xl font-bold text-white mb-1">Link de Agendamento Luxuoso</h4>
                          <p className="text-gray-400">O seu cliente não vai abrir uma planilha feia. Ele verá um catálogo escuro com toques em dourado, mostrando que você é uma profissional de alto nível.</p>
                      </div>
                  </div>
                  <div className="flex gap-4">
                      <div className="mt-1 bg-amber-500/10 p-2 rounded-lg h-fit"><Smartphone className="w-6 h-6 text-amber-500" /></div>
                      <div>
                          <h4 className="text-xl font-bold text-white mb-1">Piloto Automático 24h</h4>
                          <p className="text-gray-400">Coloque o seu link na Bio do Instagram. O cliente clica, escolhe o horário e faz o pagamento enquanto você está dormindo.</p>
                      </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 rounded-3xl blur-3xl opacity-30" />
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-2 relative shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                    <img src="/finance-card.webp" alt="Gestão Financeira Cleverya" className="w-full h-auto rounded-xl shadow-inner border border-white/5" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. DEPOIMENTOS (Provas Sociais) */}
        <section className="py-24 bg-slate-900 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white">Resultados Reais</h2>
              <p className="text-gray-400 mt-4">Quem profissionalizou a agenda, não volta atrás.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Depoimento Real Baseado na Glaucia Bronze */}
              <div className="bg-[#0a0f1c] p-8 rounded-2xl border border-white/5 relative">
                <Quote className="absolute top-6 right-6 w-12 h-12 text-amber-500/10" />
                <p className="text-gray-300 mb-6 relative z-10 font-medium">"Eu tinha 20% de faltas mensais no meu espaço de bronzeamento e conflitos enormes no WhatsApp. Depois que passei a usar o Sinal via PIX da Cleverya, as faltas caíram para 4% e a minha ocupação aumentou 30%!"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 font-bold">GB</div>
                  <div>
                    <p className="font-bold text-white text-sm">Gláucia</p>
                    <p className="text-xs text-amber-500">Espaço Gláucia Bronze</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0f1c] p-8 rounded-2xl border border-white/5 relative">
                <Quote className="absolute top-6 right-6 w-12 h-12 text-amber-500/10" />
                <p className="text-gray-300 mb-6 relative z-10 font-medium">"Como trabalho sozinha com Lash Design, eu perdia clientes porque demorava a responder. Agora, o link na Bio vende por mim enquanto eu atendo. O design do site é luxuoso e combinou perfeitamente com a minha marca."</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold">AS</div>
                  <div>
                    <p className="font-bold text-white text-sm">Amanda Silva</p>
                    <p className="text-xs text-amber-500">Lash Designer Master</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0f1c] p-8 rounded-2xl border border-white/5 relative">
                <Quote className="absolute top-6 right-6 w-12 h-12 text-amber-500/10" />
                <p className="text-gray-300 mb-6 relative z-10 font-medium">"Ter relatórios exatos de quem foi atendido e dos pagamentos mudou a nossa vida. Conseguimos dividir as comissões das esteticistas muito mais rápido. O investimento paga-se só na primeira falta que o sistema evita."</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold">CM</div>
                  <div>
                    <p className="font-bold text-white text-sm">Camila Marques</p>
                    <p className="text-xs text-amber-500">Gestora de Clínica de Estética</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. PRICING */}
        <section className="py-24 bg-[#0a0f1c]" id="planos">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white">Teste o plano PRO de graça por 30 dias.</h2>
                <p className="text-gray-400 mt-4 max-w-xl mx-auto">Uma única falta que o Cleverya evitar durante o teste já paga o sistema. Escolha depois qual plano manter.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                
                {/* PLANO FREE */}
                <div className="bg-slate-900 p-8 rounded-3xl border border-white/10 flex flex-col hover:border-white/20 transition-all">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6 border border-white/5"><Zap className="w-6 h-6 text-slate-400" /></div>
                  <h3 className="text-2xl font-bold text-white mb-2">Cleverya Free</h3>
                  <div className="mb-6"><span className="text-4xl font-black text-white">Grátis</span></div>
                  <p className="text-gray-400 mb-8 text-sm h-10">O básico para começar a organizar horários e ter o link na Bio.</p>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Link de agendamento online</li>
                    <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Até 50 agendamentos /mês</li>
                    <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> 1 Profissional na equipe</li>
                    <li className="flex items-start gap-3 text-sm text-gray-600 line-through"><X className="w-5 h-5 shrink-0" /> Sem cobrança de Sinal via PIX</li>
                  </ul>
                  <Link to="/signup"><button className="w-full py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-all">Criar Conta Gratuita</button></Link>
                </div>

                {/* PLANO PRO (Destaque) */}
                <div className="bg-slate-800 p-8 rounded-3xl border-2 border-amber-500 relative transform md:-translate-y-4 shadow-[0_0_40px_rgba(245,158,11,0.2)] flex flex-col z-10">
                  <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-2xl text-sm uppercase tracking-wider">30 Dias Grátis</div>
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-6 border border-amber-500/30"><Sparkles className="w-6 h-6 text-amber-500" /></div>
                  <h3 className="text-2xl font-bold text-white mb-2">Cleverya Pro</h3>
                  
                  <div className="mb-6 flex items-end gap-1">
                    <span className="text-lg text-slate-400 mb-1">{currencySymbol}</span>
                    <span className="text-5xl font-black text-white">{pricePro}</span>
                    <span className="text-slate-400 mb-1">/mês</span>
                  </div>
                  
                  <p className="text-gray-300 mb-8 text-sm h-10 font-medium">Acabe com as faltas cobrando o sinal antes do atendimento.</p>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-start gap-3 text-sm text-white font-medium"><CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" /> Tudo do plano Grátis</li>
                    <li className="flex items-start gap-3 text-sm text-white font-bold"><CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" /> Cobrança de Sinal via PIX</li>
                    <li className="flex items-start gap-3 text-sm text-white font-medium"><CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" /> Agendamentos Ilimitados</li>
                    <li className="flex items-start gap-3 text-sm text-white font-medium"><CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" /> Até 3 profissionais</li>
                  </ul>
                  
                  <Link to="/signup?plan=pro">
                    <button className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-[1.02] transition-all text-lg animate-pulse">
                      Testar 30 dias grátis
                    </button>
                  </Link>
                </div>

                {/* PLANO BUSINESS */}
                <div className="bg-slate-900 p-8 rounded-3xl border border-white/10 flex flex-col hover:border-white/20 transition-all">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 border border-purple-500/30"><Building2 className="w-6 h-6 text-purple-400" /></div>
                  <h3 className="text-2xl font-bold text-white mb-2">Cleverya Business</h3>
                  
                  <div className="mb-6 flex items-end gap-1">
                    <span className="text-lg text-slate-400 mb-1">{currencySymbol}</span>
                    <span className="text-4xl font-black text-white">{priceBiz}</span>
                    <span className="text-slate-400 mb-1">/mês</span>
                  </div>
                  
                  <p className="text-gray-400 mb-8 text-sm h-10">Para estúdios, clínicas e espaços com grande equipe.</p>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" /> Tudo do plano Pro</li>
                    <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" /> Profissionais Ilimitados</li>
                    <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" /> Múltiplas Unidades</li>
                    <li className="flex items-start gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" /> Relatórios Avançados</li>
                  </ul>
                  <Link to="/signup?plan=business"><button className="w-full py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-all">Assinar Business</button></Link>
                </div>

              </div>
              <p className="text-center text-sm text-gray-500 mt-8">Cancele quando quiser. Sem taxas escondidas. Sem fidelidade.</p>
            </div>
        </section>

        {/* 7. FAQ */}
        <section className="py-24 bg-slate-900 border-t border-white/5">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white">Perguntas Frequentes</h2>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-[#0a0f1c] border border-white/5 rounded-xl overflow-hidden transition-all">
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 flex items-center justify-between font-bold text-left text-gray-200 hover:text-white"
                  >
                    {faq.q}
                    <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === index ? 'rotate-180 text-amber-500' : 'text-gray-500'}`} />
                  </button>
                  <m.div initial={false} animate={{ height: openFaq === index ? 'auto' : 0, opacity: openFaq === index ? 1 : 0 }} className="overflow-hidden">
                    <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                      {faq.a}
                    </div>
                  </m.div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. CTA FINAL */}
        <section className="py-32 relative overflow-hidden bg-[#0a0f1c] border-t border-white/5 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent -z-10" />
          
          <div className="max-w-4xl mx-auto px-4 relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              Assuma o controle financeiro do seu espaço <span className="text-amber-500">hoje mesmo.</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
              Teste todas as funcionalidades Premium por 30 dias gratuitos. Chega de perder dinheiro com clientes que não aparecem.
            </p>
            <div className="flex flex-col items-center justify-center">
              <Link to="/signup">
                <button className="bg-gradient-to-r from-amber-400 to-orange-500 hover:scale-105 transform duration-200 text-slate-950 text-xl px-12 py-5 rounded-full font-bold shadow-[0_0_40px_rgba(245,158,11,0.4)] flex items-center gap-3">
                  <Star className="w-6 h-6" /> Testar PRO grátis por 30 dias
                </button>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </LazyMotion>
  );
}