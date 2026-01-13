import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  pt: {
    translation: {
      common: {
        loading: "Carregando...",
        back_home: "Voltar para Home",
        app_name: "BeautyBook",
        save: "Salvar",
        cancel: "Cancelar",
        edit: "Editar",
        delete: "Excluir",
        create: "Criar",
        update: "Atualizar",
        yes: "Sim",
        no: "Não",
        confirm_delete: "Tem certeza que deseja excluir?",
        search_placeholder: "Buscar...",
        weekdays: {
          0: "Domingo",
          1: "Segunda-feira",
          2: "Terça-feira",
          3: "Quarta-feira",
          4: "Quinta-feira",
          5: "Sexta-feira",
          6: "Sábado"
        }
      },
      auth: {
        login_title: "Acesse sua conta",
        login_subtitle: "Gerencie seu negócio de qualquer lugar.",
        signup_title: "Comece Gratuitamente",
        signup_subtitle: "Organize sua agenda e fature mais.",
        label_business: "Nome do Negócio",
        label_email: "E-mail",
        label_password: "Senha",
        placeholder_business: "Ex: Estúdio Bella",
        placeholder_password: "Mínimo 6 caracteres",
        btn_login: "Entrar",
        btn_signup: "Criar Conta",
        btn_loading: "Processando...",
        link_have_account: "Já tem uma conta? Entrar",
        link_no_account: "Não tem uma conta? Cadastre-se",
        error_generic: "Ocorreu um erro. Tente novamente.",
        signup_success_title: "Verifique seu Email",
        signup_success_msg: "Enviamos um link de confirmação para",
        btn_back_login: "Voltar para Login"
      },
      booking: {
        default_business_name: "Agendar Horário",
        premium_exp: "Experiência Premium",
        step_service: "Qual procedimento você deseja?",
        step_date: "Escolha o melhor horário",
        step_info: "Confirme seus dados",
        step_success: "Agendamento Confirmado!",
        category_label: "Categoria",
        minutes_session: "minutos de sessão",
        label_prof: "1. Profissional",
        no_prof: "Nenhum profissional disponível.",
        label_date: "2. Data",
        label_time: "3. Horário",
        no_slots: "Sem horários livres.",
        btn_continue: "Continuar",
        summary_title: "Resumo do Pedido",
        prof_prefix: "Profissional:",
        label_name: "Seu Nome",
        label_phone: "WhatsApp / Telefone",
        placeholder_name: "Ex: Maria Silva",
        placeholder_phone: "(11) 99999-9999",
        btn_confirm: "Confirmar Agendamento",
        btn_confirming: "Confirmando...",
        success_title: "Agendado!",
        success_msg: "Tudo certo, {{name}}. Seu horário para {{service}} está reservado.",
        btn_calendar: "Adicionar à Agenda",
        btn_new: "Fazer outro agendamento"
      },
      dashboard: {
        link_btn: "Link de Agendamento",
        tabs: {
          overview: "Visão Geral",
          calendar: "Agenda",
          services: "Serviços",
          team: "Equipe",
          clients: "Clientes",
          financial: "Financeiro",
          settings: "Ajustes"
        },
        // FILTROS QUE ESTAVAM FALTANDO
        filters: {
          today: "Hoje",
          week: "Esta Semana",
          month: "Este Mês"
        },
        // MÉTRICAS QUE ESTAVAM FALTANDO
        metrics: {
          revenue: "Receita Recebida",
          forecast: "Previsão",
          services: "Serviços Realizados"
        },
        overview: {
          today: "Hoje",
          pending: "Pendentes",
          confirmed: "Confirmados",
          noshow: "No-Show",
          title_pending: "Solicitações Pendentes",
          title_today: "Agenda de Hoje",
          no_pending: "Tudo em dia! Nenhuma solicitação pendente.",
          no_today: "Agenda livre para hoje.",
          btn_confirm: "Confirmar",
          btn_reschedule: "Reagendar",
          status_noshow: "Faltou",
          new_badge: "NOVOS"
        },
        calendar: {
          title: "Agenda",
          week: "Semana",
          today: "Hoje",
          from: "De",
          to: "Até",
          summary: "Resumo do Período",
          total: "Total",
          no_appointments: "Nenhum agendamento encontrado neste período."
        },
        services: {
          title: "Menu de Serviços",
          subtitle: "Organize o que seu estabelecimento oferece.",
          btn_new: "Novo Serviço",
          label_name: "Nome do Serviço",
          label_category: "Categoria",
          label_price: "Valor",
          label_duration: "Duração (min)",
          label_desc: "Descrição",
          empty_title: "Seu menu está vazio",
          empty_desc: "Cadastre seus serviços e categorias para começar a receber agendamentos."
        },
        team: {
          title: "Equipe & Capacidade",
          subtitle: "Gerencie quem trabalha e quantos clientes cada um atende simultaneamente.",
          btn_new: "Novo Profissional",
          label_name: "Nome",
          label_capacity: "Capacidade de Atendimento",
          hint_capacity: "Coloque 1 para exclusivo, 4 para atender 4 pessoas ao mesmo tempo.",
          active: "Ativo",
          inactive: "Inativo",
          empty: "Nenhum profissional cadastrado."
        },
        clients: {
          title: "Clientes",
          subtitle: "Gerencie seus clientes e bloqueios",
          blocked_title: "Clientes Bloqueados",
          btn_block: "Bloquear Cliente",
          btn_unblock: "Desbloquear",
          stats_total: "Total",
          stats_confirmed: "Confirmados",
          stats_noshow: "Faltas",
          empty: "Nenhum cliente encontrado"
        },
        financial: {
          title: "Relatório Financeiro",
          subtitle: "Analise o desempenho e faturamento.",
          card_realized: "Valor Recebido",
          card_forecast: "Previsão",
          card_volume: "Serviços Realizados",
          filter_all: "Todos",
          filter_realized: "Realizados",
          filter_forecast: "A Receber",
          table: {
            date: "Data",
            time: "Hora",
            client: "Cliente",
            service: "Serviço",
            professional: "Profissional",
            value: "Valor",
            status: "Status"
          }
        },
        settings: {
          title: "Configurações",
          subtitle: "Gerencie seus horários e perfil",
          operating_hours: "Disponibilidade Semanal",
          operating_subtitle: "Defina os dias e horários que você atende.",
          business_name: "Nome do Estabelecimento",
          banner_title: "Banner da Página",
          banner_help: "Recomendado: 1200x400px. Torne sua página única.",
          link_title: "Link Público de Agendamento",
          link_desc: "Compartilhe este link com seus clientes.",
          save_btn: "Salvar Alterações",
          upload_text: "Clique para enviar uma foto",
          label_open: "Abertura",
          label_close: "Fechamento",
          btn_save_time: "Salvar Horário",
          closed: "Fechado"
        }
      },
      landing: {
        badge: "Gestão Inteligente & Financeiro",
        hero_title_1: "Sua agenda cheia.",
        hero_title_2: "Seu negócio no azul.",
        hero_subtitle: "A plataforma completa para salões e clínicas.",
        btn_start: "Começar Grátis Agora",
        disclaimer: "TESTE GRÁTIS DE 7 DIAS",
        mockup_new_app: "Novo Agendamento",
        mockup_confirmed: "Confirmado",
        mockup_revenue: "Receita Hoje",
        features_title: "Feito para o",
        features_title_highlight: "seu sucesso",
        features_subtitle: "Ferramentas adaptadas para escalar o seu negócio.",
        segment_salon: "Salões de Beleza",
        segment_nails: "Esmalterias",
        segment_clinic: "Clínicas de Estética",
        segment_spa: "Spas & Bem-estar",
        footer_copy: "© 2025 BeautyBook."
      }
    }
  },
  en: {
    translation: {
      common: {
        loading: "Loading...",
        back_home: "Back to Home",
        app_name: "BeautyBook",
        save: "Save",
        cancel: "Cancel",
        edit: "Edit",
        delete: "Delete",
        create: "Create",
        update: "Update",
        yes: "Yes",
        no: "No",
        confirm_delete: "Are you sure you want to delete?",
        search_placeholder: "Search...",
        weekdays: {
          0: "Sunday",
          1: "Monday",
          2: "Tuesday",
          3: "Wednesday",
          4: "Thursday",
          5: "Friday",
          6: "Saturday"
        }
      },
      auth: {
        login_title: "Welcome back",
        login_subtitle: "Manage your business from anywhere.",
        signup_title: "Get Started for Free",
        signup_subtitle: "Organize your schedule and earn more.",
        label_business: "Business Name",
        label_email: "Email",
        label_password: "Password",
        placeholder_business: "Ex: Bella Studio",
        placeholder_password: "Minimum 6 characters",
        btn_login: "Sign In",
        btn_signup: "Create Account",
        btn_loading: "Processing...",
        link_have_account: "Already have an account? Sign In",
        link_no_account: "Don't have an account? Sign Up",
        error_generic: "An error occurred. Please try again.",
        signup_success_title: "Check your Email",
        signup_success_msg: "We sent a confirmation link to",
        btn_back_login: "Back to Login"
      },
      booking: {
        default_business_name: "Book Appointment",
        premium_exp: "Premium Experience",
        step_service: "Which procedure would you like?",
        step_date: "Choose the best time",
        step_info: "Confirm your details",
        step_success: "Booking Confirmed!",
        category_label: "Category",
        minutes_session: "session minutes",
        label_prof: "1. Professional",
        no_prof: "No professionals available.",
        label_date: "2. Date",
        label_time: "3. Time",
        no_slots: "No slots available.",
        btn_continue: "Continue",
        summary_title: "Booking Summary",
        prof_prefix: "Professional:",
        label_name: "Full Name",
        label_phone: "WhatsApp / Phone",
        placeholder_name: "Ex: Jane Doe",
        placeholder_phone: "(555) 123-4567",
        btn_confirm: "Confirm Booking",
        btn_confirming: "Confirming...",
        success_title: "Booked!",
        success_msg: "All set, {{name}}. Your appointment for {{service}} is reserved.",
        btn_calendar: "Add to Calendar",
        btn_new: "Book another appointment"
      },
      dashboard: {
        link_btn: "Booking Link",
        tabs: {
          overview: "Overview",
          calendar: "Calendar",
          services: "Services",
          team: "Team",
          clients: "Clients",
          financial: "Financial",
          settings: "Settings"
        },
        filters: {
          today: "Today",
          week: "This Week",
          month: "This Month"
        },
        metrics: {
          revenue: "Revenue Received",
          forecast: "Forecast",
          services: "Services Performed"
        },
        overview: {
          today: "Today",
          pending: "Pending",
          confirmed: "Confirmed",
          noshow: "No-Show",
          title_pending: "Pending Requests",
          title_today: "Today's Schedule",
          no_pending: "All caught up! No pending requests.",
          no_today: "Schedule clear for today.",
          btn_confirm: "Confirm",
          btn_reschedule: "Reschedule",
          status_noshow: "No-Show",
          new_badge: "NEW"
        },
        calendar: {
          title: "Calendar",
          week: "Week",
          today: "Today",
          from: "From",
          to: "To",
          summary: "Period Summary",
          total: "Total",
          no_appointments: "No appointments found in this period."
        },
        services: {
          title: "Services Menu",
          subtitle: "Organize what your establishment offers.",
          btn_new: "New Service",
          label_name: "Service Name",
          label_category: "Category",
          label_price: "Price",
          label_duration: "Duration (min)",
          label_desc: "Description",
          empty_title: "Your menu is empty",
          empty_desc: "Register your services and categories to start receiving bookings."
        },
        team: {
          title: "Team & Capacity",
          subtitle: "Manage who works and how many clients they serve simultaneously.",
          btn_new: "New Professional",
          label_name: "Name",
          label_capacity: "Service Capacity",
          hint_capacity: "Set 1 for exclusive, 4 to serve 4 people at the same time.",
          active: "Active",
          inactive: "Inactive",
          empty: "No professionals registered."
        },
        clients: {
          title: "Clients",
          subtitle: "Manage your clients and blocks",
          blocked_title: "Blocked Clients",
          btn_block: "Block Client",
          btn_unblock: "Unblock",
          stats_total: "Total",
          stats_confirmed: "Confirmed",
          stats_noshow: "No-Shows",
          empty: "No clients found"
        },
        financial: {
          title: "Financial Report",
          subtitle: "Analyze performance and revenue.",
          card_realized: "Revenue Received",
          card_forecast: "Forecast",
          card_volume: "Services Performed",
          filter_all: "All",
          filter_realized: "Realized",
          filter_forecast: "Forecast",
          table: {
            date: "Date",
            time: "Time",
            client: "Client",
            service: "Service",
            professional: "Professional",
            value: "Value",
            status: "Status"
          }
        },
        settings: {
          title: "Settings",
          subtitle: "Configure your profile and availability.",
          operating_hours: "Operating Hours",
          operating_subtitle: "Set your weekly schedule.",
          business_name: "Business Name",
          banner_title: "Page Banner",
          banner_help: "Recommended: 1200x400px.",
          link_title: "Public Booking Link",
          link_desc: "Share this link with your clients.",
          save_btn: "Save Changes",
          upload_text: "Click to upload photo",
          label_open: "Opening",
          label_close: "Closing",
          btn_save_time: "Save Hours",
          closed: "Closed"
        }
      },
      landing: {
        badge: "Smart Management",
        hero_title_1: "Your calendar full.",
        hero_title_2: "Your business profitable.",
        hero_subtitle: "The complete platform.",
        btn_start: "Start Free",
        disclaimer: "7-DAY FREE TRIAL",
        mockup_new_app: "New Booking",
        mockup_confirmed: "Confirmed",
        mockup_revenue: "Revenue",
        features_title: "Built for",
        features_title_highlight: "your success",
        features_subtitle: "Tools adapted to scale.",
        segment_salon: "Beauty Salons",
        segment_nails: "Nail Salons",
        segment_clinic: "Aesthetic Clinics",
        segment_spa: "Spas",
        footer_copy: "© 2025 BeautyBook."
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;