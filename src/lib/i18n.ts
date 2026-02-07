import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  pt: {
    translation: {
      common: {
        confirm: "Confirmar",
        complete: "Realizar",
        undo: "Desfazer",
        restore: "Restaurar",
        print: "Imprimir",
        loading: "Carregando...",
        back_home: "Voltar para Home",
        back: "Voltar", // Adicionado
        app_name: "Cleverya",
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
        client: "Cliente",
        closed: "Fechado",
        open: "Aberto",
        from: "De",
        to: "Até",
        premium: "Premium",
        sales: "vendas",
        image_url_help: "Cole o link de uma imagem (Ex: Imgur).",
        copy_all: "Copiar para todos",
        help: "Ver Tutorial", // Novo

        weekdays: {
          0: "Domingo",
          1: "Segunda-feira",
          2: "Terça-feira",
          3: "Quarta-feira",
          4: "Quinta-feira",
          5: "Sexta-feira",
          6: "Sábado"
        },
      tutorial: {
        welcome_title: "Bem-vindo ao Cleverya!",
        welcome_subtitle: "Siga estes 5 passos para lotar sua agenda:",
        step1_title: "1. Cadastre seus Serviços",
        step1_desc: "Vá na aba 'Serviços' e crie o que você oferece (ex: Corte, Barba).",
        step2_title: "2. Cadastre a Equipe",
        step2_desc: "Em 'Equipe', cadastre quem atende. No plano Free, cadastre você mesmo.",
        step3_title: "3. Ajustes e Foto",
        step3_desc: "Em 'Ajustes', defina Horários e Nome do local. Para a FOTO: Copie o link de uma imagem (Google Imagens) e cole no campo indicado.",
        step4_title: "4. Divulgue seu Link",
        step4_desc: "Copie seu link no topo da página e coloque na bio do Instagram ou envie no WhatsApp.",
        step5_title: "5. Gerencie a Agenda",
        step5_desc: "Novos agendamentos aparecem na aba 'Agenda'. Confirme e envie mensagem no Zap. O cliente também recebe notificação por e-mail.",
        auto_save: "Siga a ordem para evitar erros.",
        btn_start: "Entendi, vamos lá!"
      },
      },
      status: {
        pending: "Pendente",
        confirmed: "Confirmado",
        completed: "Realizado",
        cancelled: "Cancelado"
      },
      toasts: {
        success_general: "Salvo com sucesso!",
        error_general: "Ocorreu um erro.",
        client_blocked: "Cliente bloqueado!",
        client_unblocked: "Desbloqueado!",
        error_block: "Erro ao bloquear.",
        error_unblock: "Erro ao desbloquear.",
        profile_updated: "Perfil atualizado!",
        profile_error: "Erro ao atualizar perfil.",
        schedule_saved: "Horários salvos!",
        schedule_error: "Erro ao salvar horários.",
        schedule_copied: "Copiado para todos os dias.",
        confirmed: "Confirmado!",
        cancelled: "Cancelado.",
        service_created: "Serviço criado com sucesso!",
        service_error: "Erro ao criar serviço. Tente um nome diferente.",
        service_deleted: "Serviço removido.",
        service_delete_error: "Erro ao remover serviço.",
        pro_added: "Profissional adicionado!",
        pro_add_error: "Erro ao adicionar profissional.",
        pro_deleted: "Profissional removido.",
        pro_delete_error: "Erro ao remover profissional.",
        whatsapp_confirm: "Deseja enviar a confirmação para {{name}} no WhatsApp?",
        confirm_cancel_app: "Tem certeza que deseja cancelar?",
        confirm_delete_service: "Excluir este serviço?",
        link_copied: "Link copiado!",
        completed: "Serviço realizado! Valor computado.",
        undo: "Status revertido para pendente.",
        restore: "Agendamento restaurado.",
        opening_portal: "Abrindo portal...",
        error_portal: "Erro ao abrir portal.",
        subscription_active_q: "Você tem uma assinatura ativa?"
      },
      // --- NOVAS SEÇÕES ---
      legal: {
        terms_title: "Termos de Uso",
        privacy_title: "Política de Privacidade",
        last_updated: "Última atualização",
        contact_title: "Contato",
        support_email: "E-mail de Suporte",
        legal_email: "E-mail Jurídico"
      },
      not_found: {
        title: "404",
        subtitle: "Página não encontrada",
        desc: "Ops! O link que você tentou acessar não existe ou foi removido. Verifique se o endereço está correto.",
        btn_home: "Voltar para o Início"
      },
      // --------------------
      booking: {
        default_business_name: "Agendamento Online",
        limit_title: "Agendamentos Pausados",
        limit_desc: "Este estabelecimento atingiu o limite mensal. Entre em contato diretamente.",
        premium_exp: "Experiência Premium",
        step_service: "Selecione um serviço",
        step_date: "Data & Hora",
        step_identification: "Identificação",
        step_confirmation: "Confirmação",
        btn_continue: "Continuar",
        btn_confirm: "Confirmar",
        confirming: "Confirmando...",
        btn_new: "Novo Agendamento",
        success_title: "Agendado!",
        success_msg: "Tudo certo, {{name}}! Seu agendamento para {{service}} está confirmado.",
        welcome_back: "Olá, {{name}}!",
        blocked_error: "Você não pode agendar neste local.",
        error_fetch_slots: "Erro ao buscar horários",
        error_verify: "Erro ao verificar telefone",
        no_slots: "Sem horários",
        label_your_name: "Seu Nome",
        label_email_optional: "Email (Opcional)",
        category_general: "Geral"
      },
      auth: {
        login_title: "Acesse sua conta",
        login_subtitle: "Gerencie seu negócio de qualquer lugar.",
        signup_title: "Comece Gratuitamente",
        signup_subtitle: "Organize sua agenda e fature mais.",
        label_business: "Nome do Negócio",
        label_email: "E-mail",
        label_password: "Senha",
        forgot_password: "Esqueceu a senha?",
        placeholder_business: "Ex: Consultório Silva",
        placeholder_email: "seu@email.com",
        placeholder_password: "Mínimo 6 caracteres",
        btn_login: "Entrar",
        btn_signup: "Criar Conta",
        btn_loading: "Processando...",
        link_have_account: "Já tem uma conta? Entrar",
        link_no_account: "Não tem uma conta? Cadastre-se",
        no_account_question: "Não tem uma conta?",
        signup_link_text: "Cadastre-se",
        error_generic: "Ocorreu um erro. Tente novamente.",
        error_login_generic: "Erro ao entrar. Verifique suas credenciais.",
        error_login_invalid: "E-mail ou senha incorretos.",
        error_login_unconfirmed: "E-mail não confirmado.",
        validation_email: "E-mail inválido",
        validation_password_min: "A senha deve ter no mínimo 6 caracteres",
        signup_success_title: "Verifique seu Email",
        signup_success_msg: "Enviamos um link de confirmação para",
        btn_back_login: "Voltar para Login"
      },
      dashboard: {
        link_btn: "Link de Agendamento",
        link_copied: "Link copiado!",
        manage_subscription: "Gerenciar Assinatura", // Adicionado
        subscription_short: "Assinatura", // Adicionado
        banner: {
          description: "Desbloqueie relatórios avançados, múltiplos profissionais e lembretes automáticos.",
          cta: "Ver Planos",
          upgrade_pro_title: "Seja Cleverya Pro",
          upgrade_biz_title: "Migre para o Business",
          upgrade_pro_desc: "Desbloqueie agendamentos ilimitados e remova a marca Cleverya.",
          upgrade_biz_desc: "Gerencie múltiplos profissionais, locais e tenha relatórios avançados.",
          title: "Agenda",
          today: "Hoje",
          week: "Semana",
          summary: "Resumo",
          total: "Total",
          pending: "Pendentes",
          confirmed: "Confirmados",
          completed: "Realizados",
          no_appointments: "Nenhum agendamento neste período.",
          refresh: "Atualizar"
        },
        tabs: {
          overview: "Visão Geral",
          calendar: "Agenda",
          services: "Serviços",
          team: "Equipe",
          clients: "Base",
          financial: "Financeiro",
          settings: "Ajustes"
        },
        overview: {
          today: "Agenda Hoje",
          pending: "Pendentes",
          confirmed: "Confirmados",
          noshow: "No-Show",
          title_pending: "Solicitações Pendentes",
          title_today: "Visão Geral",
          subtitle: "Resumo financeiro e operacional deste mês.",
          no_pending: "Tudo em dia! Nenhuma solicitação pendente.",
          no_today: "Agenda livre para hoje.",
          btn_confirm: "Confirmar",
          btn_reschedule: "Ver Agenda",
          status_noshow: "Faltou",
          new_badge: "NOVOS",
          revenue: "Faturamento (Mês)",
          total_clients: "Base de Clientes",
          next_schedules: "Próximos Horários",
          no_future_appointments: "Nenhum agendamento futuro.",
          financial_performance: "Desempenho Financeiro",
          daily_revenue: "Receita diária confirmada"
        },
        calendar: {
          title: "Agenda",
          week: "Semana",
          today: "Hoje",
          summary: "Resumo",
          total: "Total",
          confirmed: "Confirmados",
          pending: "Pendentes",
          completed: "Realizados",
          refresh: "Atualizar",
          no_appointments: "Nenhum agendamento encontrado neste período."
        },
        services: {
          title: "Serviços",
          subtitle: "Configure o que você oferece aos clientes.",
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
          title: "Equipe",
          subtitle: "Gerencie quem atende em sua empresa.",
          btn_new: "Adicionar Profissional",
          active_count: "Ativos",
          label_name: "Nome",
          label_capacity: "Capacidade",
          active: "Ativo",
          inactive: "Inativo",
          empty: "Nenhum profissional cadastrado.",
          limit_free: "Plano Gratuito: Limite de 1 profissional atingido.",
          limit_pro: "Plano Pro: Limite de 3 profissionais atingido."
        },
        clients: {
          title: "Clientes",
          subtitle: "Gerencie sua base de clientes.",
          blocked_title: "Bloqueados",
          btn_block: "Bloquear",
          btn_unblock: "Desbloquear",
          stats_total: "Total",
          stats_ok: "OK", 
          stats_faults: "Faltas"
        },
        reports: {
          title: "Relatórios Financeiros",
          subtitle: "Acompanhe seus números.",
          total_revenue: "Faturamento Total",
          current_month: "Mês atual",
          last_month: "Mês passado",
          last_3_months: "Últimos 3 meses",
          custom: "Personalizado",
          real_data: "Dados reais",
          ticket_avg: "Ticket Médio",
          top_services: "Top Serviços",
          daily_revenue: "Receita Diária",
          no_data: "Nenhum dado ainda.",
          revenue: "Receita",
          appointments: "Agendamentos"
        },
        settings: {
          profile_title: "Perfil da Empresa",
          profile_desc: "Como seus clientes veem seu negócio.",
          business_name: "Nome do Estabelecimento",
          slug_label: "Link de Agendamento",
          banner_label: "Banner (URL da Imagem)",
          btn_save_profile: "Salvar Perfil",
          hours_title: "Horários de Atendimento",
          hours_desc: "Defina quando sua empresa está aberta.",
          btn_save_hours: "Salvar Horários",
          closed: "Fechado"
        }
      },
      landing: {
        plans: {
          title: "Investimento que se paga no 1º dia",
          subtitle: "Escolha o plano ideal para o tamanho do seu negócio.",
          per_month: "/mês",
          monthly: "Mensal",
          yearly: "Anual",
          free: {
            title: "Cleverya Free",
            desc: "Para começar e sentir o valor.",
            item_1: "Até 50 agendamentos/mês",
            cta: "Começar Grátis"
          },
          pro: {
            badge: "MAIS POPULAR",
            title: "Cleverya Pro",
            desc: "Para quem vive de atendimento.",
            cta: "Assinar Pro"
          },
          business: {
            title: "Cleverya Business",
            desc: "Para estúdios e clínicas.",
            cta: "Assinar Business"
          },
          features: {
            unlimited_app: "Agendamentos Ilimitados",
            pro_reports: "Relatórios Básicos",
            no_branding: "Link sem marca Cleverya",
            everything_pro: "Tudo do plano Pro",
            multi_prof: "Até 3 profissionais",
            adv_reports: "Relatórios Avançados",
            locations: "Múltiplos Locais e Profissionais Ilimitados"
          },
          compare: {
            title: "Comparativo Rápido",
            feature: "Recurso",
            all: "Todos",
            others: "Outros Apps",
            charged_separately: "Cobrado à parte"
          }
        },
        nav: {
          how: "Como funciona",
          benefits: "Benefícios",
          plans: "Preços",
          login: "Entrar",
          start: "Começar Grátis"
        },
        hero: {
          badge: "O App nº 1 para Profissionais Liberais",
          title_1: "Sua agenda lotada.",
          title_highlight: "Seu tempo,",
          title_2: "organizado.",
          subtitle: "A plataforma completa para Psicólogos, Barbeiros, Consultores, Personal Trainers e Estética.",
          cta: "Criar minha Agenda Grátis",
          micro: "Não precisa de cartão de crédito"
        },
        pain: {
          badge: "O PROBLEMA",
          title: "Você perde dinheiro tentando se organizar?",
          item_1: "Whatsapp lotado de mensagens não respondidas",
          item_2: "Clientes esquecem e te deixam na mão",
          item_3: "Interrupções constantes durante o atendimento",
          item_4: "Falta de controle financeiro",
        },
        how: {
          title: "Como funciona?",
          subtitle: "Simples, rápido e pensado para quem vive atendendo.",
          step_1_title: "Cadastre seus serviços",
          step_1_desc: "Defina horários e preços.",
          step_2_title: "Compartilhe seu link",
          step_2_desc: "Envie no WhatsApp ou Instagram.",
          step_3_title: "Receba agendamentos",
          step_3_desc: "O cliente agenda sozinho."
        },
        benefits: {
          title_1: "Profissionalismo que",
          title_highlight: "conquista clientes",
          item_1: "Link de agendamento 24h",
          item_2: "Lembretes via E-mail e WhatsApp",
          item_3: "Gestão financeira",
          item_4: "Histórico de clientes"
        },
        versatility: {
            badge: "VERSATILIDADE",
            title: "Feito para o",
            title_highlight: "seu sucesso",
            subtitle: "Ferramentas adaptadas para escalar o seu negócio, seja qual for a sua área."
        },
        niches: {
            barber_title: "Barbearias & Salões",
            barber_desc: "Agenda organizada por barbeiro e comissões automáticas.",
            health_title: "Psicólogos & Terapeutas",
            health_desc: "Prontuário seguro e redução de faltas dos pacientes.",
            trainer_title: "Personal Trainers",
            trainer_desc: "Gerencie alunos, avaliações e pagamentos recorrentes.",
            consultant_title: "Consultores & Advogados",
            consultant_desc: "Reuniões marcadas sem troca interminável de e-mails."
        },
        floating: {
            new_app: "Novo Agendamento",
            confirmed: "Confirmado",
            revenue_week: "Receita da Semana",
            revenue_today: "Receita Hoje"
        },
        cta_final: {
          title: "Profissionalize seu negócio hoje.",
          subtitle: "Junte-se a milhares de profissionais.",
          btn: "Criar Conta Gratuita"
        },
        footer: {
          copy: "© 2025 Cleverya. Todos os direitos reservados.",
          terms: "Termos de Uso",
          privacy: "Privacidade",
          instagram: "Instagram"
        }
      }
    }
  },
  en: {
    translation: {
      common: {
        loading: "Loading...",
        back_home: "Back to Home",
        back: "Back", // Adicionado
        app_name: "Cleverya",
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
        client: "Customer",
        closed: "Closed",
        open: "Open",
        from: "From",
        to: "To",
        premium: "Premium",
        sales: "sales",
        image_url_help: "Paste an image link (e.g., Imgur).",
        copy_all: "Copy to all",
        confirm: "Confirm",
        complete: "Complete",
        undo: "Undo",
        restore: "Restore",
        print: "Print",
        help: "View Tutorial", // Novo
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
      tutorial: {
        welcome_title: "Welcome to Cleverya!",
        welcome_subtitle: "Follow these 5 steps to fill your schedule:",
        step1_title: "1. Register your Services",
        step1_desc: "Go to the 'Services' tab and create what you offer (e.g., Haircut, Beard).",
        step2_title: "2. Register the Team",
        step2_desc: "In 'Team', register who provides service. On the Free plan, register yourself.",
        step3_title: "3. Settings & Photo",
        step3_desc: "In 'Settings', set Hours and Location Name. For the PHOTO: Copy an image link (Google Images) and paste it into the field.",
        step4_title: "4. Share your Link",
        step4_desc: "Copy your link at the top of the page and put it in your Instagram bio or send it via WhatsApp.",
        step5_title: "5. Manage Appointments",
        step5_desc: "New appointments appear in the 'Agenda' tab. Confirm them and message the client. They also receive an email notification.",
        auto_save: "Follow the order to avoid errors.",
        btn_start: "Got it, let's go!"
      },
      status: {
        pending: "Pending",
        confirmed: "Confirmed",
        completed: "Completed",
        cancelled: "Cancelled"
      },
      toasts: {
        success_general: "Saved successfully!",
        error_general: "An error occurred.",
        client_blocked: "Client blocked!",
        client_unblocked: "Unblocked!",
        error_block: "Error blocking client.",
        error_unblock: "Error unblocking client.",
        profile_updated: "Profile updated!",
        profile_error: "Error updating profile.",
        schedule_saved: "Schedule saved!",
        schedule_error: "Error saving schedule.",
        schedule_copied: "Copied to all days.",
        confirmed: "Confirmed!",
        cancelled: "Cancelled.",
        service_created: "Service created successfully!",
        service_error: "Error creating service. Try a different name.",
        service_deleted: "Service deleted.",
        service_delete_error: "Error deleting service.",
        pro_added: "Professional added!",
        pro_add_error: "Error adding professional.",
        pro_deleted: "Professional removed.",
        pro_delete_error: "Error removing professional.",
        whatsapp_confirm: "Send confirmation to {{name}} on WhatsApp?",
        confirm_cancel_app: "Are you sure you want to cancel?",
        confirm_delete_service: "Delete this service?",
        link_copied: "Link copied!",
        completed: "Service completed! Value added to revenue.",
        undo: "Status reverted to pending.",
        restore: "Appointment restored.",
        opening_portal: "Opening portal...",
        error_portal: "Error opening portal.",
        subscription_active_q: "Do you have an active subscription?"
      },
      // --- NOVAS SEÇÕES EN ---
      legal: {
        terms_title: "Terms of Use",
        privacy_title: "Privacy Policy",
        last_updated: "Last updated",
        contact_title: "Contact",
        support_email: "Support Email",
        legal_email: "Legal Email"
      },
      not_found: {
        title: "404",
        subtitle: "Page not found",
        desc: "Oops! The link you tried to access does not exist or has been removed. Please check the address.",
        btn_home: "Back to Home"
      },
      // -----------------------
      booking: {
        default_business_name: "Online Booking",
        limit_title: "Booking Paused",
        limit_desc: "This business has reached its monthly limit. Please contact them directly.",
        premium_exp: "Premium Experience",
        step_service: "Select a service",
        step_date: "Date & Time",
        step_identification: "Identification",
        step_confirmation: "Confirmation",
        btn_continue: "Continue",
        btn_confirm: "Confirm",
        confirming: "Confirming...",
        btn_new: "New Booking",
        success_title: "Confirmed!",
        success_msg: "All set, {{name}}! Your booking for {{service}} is confirmed.",
        welcome_back: "Welcome back, {{name}}!",
        blocked_error: "You cannot book at this location.",
        error_fetch_slots: "Error fetching slots",
        error_verify: "Error verifying phone",
        no_slots: "No slots available",
        label_your_name: "Your Name",
        label_email_optional: "Email (Optional)",
        category_general: "General"
      },
      auth: {
        login_title: "Welcome back",
        login_subtitle: "Manage your business from anywhere.",
        signup_title: "Get Started for Free",
        signup_subtitle: "Organize your schedule and earn more.",
        label_business: "Business Name",
        label_email: "Email",
        label_password: "Password",
        forgot_password: "Forgot password?", 
        placeholder_business: "Ex: Smith Consulting",
        placeholder_email: "you@email.com", 
        placeholder_password: "Minimum 6 characters", 
        btn_login: "Sign In",
        btn_signup: "Create Account",
        btn_loading: "Processing...",
        link_have_account: "Already have an account? Sign In",
        link_no_account: "Don't have an account? Sign Up",
        no_account_question: "Don't have an account?", 
        signup_link_text: "Sign Up", 
        error_generic: "An error occurred. Please try again.",
        error_login_generic: "Login failed. Check your credentials.", 
        error_login_invalid: "Invalid email or password.", 
        error_login_unconfirmed: "Email not confirmed.", 
        validation_email: "Invalid email", 
        validation_password_min: "Password must be at least 6 characters", 
        signup_success_title: "Check your Email",
        signup_success_msg: "We sent a confirmation link to",
        btn_back_login: "Back to Login"
      },
      dashboard: {
        link_btn: "Booking Link",
        link_copied: "Link copied!",
        manage_subscription: "Manage Subscription", // Adicionado
        subscription_short: "Subscription", // Adicionado
        banner: {
          description: "Unlock advanced reports, multiple professionals, and automatic reminders.",
          cta: "View Plans",
          upgrade_pro_title: "Go Cleverya Pro",
          upgrade_biz_title: "Upgrade to Business",
          upgrade_pro_desc: "Unlock unlimited bookings and remove Cleverya branding.",
          upgrade_biz_desc: "Manage multiple professionals, locations, and get advanced reports."
        },
        tabs: {
          overview: "Overview",
          calendar: "Calendar",
          services: "Services",
          team: "Team",
          clients: "Clients",
          financial: "Financial",
          settings: "Settings"
        },
        overview: {
          today: "Today's Schedule",
          pending: "Pending",
          confirmed: "Confirmed",
          noshow: "No-Show",
          title_pending: "Pending Requests",
          title_today: "Overview",
          subtitle: "Financial and operational summary.",
          no_pending: "All caught up!",
          no_today: "Schedule clear for today.",
          btn_confirm: "Confirm",
          btn_reschedule: "View Agenda",
          status_noshow: "No-Show",
          new_badge: "NEW",
          revenue: "Revenue (Month)",
          total_clients: "Customer Base",
          next_schedules: "Upcoming Schedules",
          no_future_appointments: "No upcoming appointments.",
          financial_performance: "Financial Performance",
          daily_revenue: "Daily confirmed revenue"
        },
        calendar: {
          title: "Calendar",
          week: "Week",
          today: "Today",
          summary: "Summary",
          total: "Total",
          confirmed: "Confirmed",
          pending: "Pending",
          completed: "Completed",
          refresh: "Refresh",
          no_appointments: "No appointments found."
        },
        services: {
          title: "Services",
          subtitle: "Set up what you offer to customers.",
          btn_new: "New Service",
          label_name: "Service Name",
          label_category: "Category",
          label_price: "Price",
          label_duration: "Duration (min)",
          label_desc: "Description",
          empty_title: "Your menu is empty",
          empty_desc: "Register your services to start."
        },
        team: {
          title: "Team",
          subtitle: "Manage your staff.",
          btn_new: "Add Professional",
          active_count: "Active",
          label_name: "Name",
          label_capacity: "Capacity",
          active: "Active",
          inactive: "Inactive",
          empty: "No professionals registered.",
          limit_free: "Free Plan Limit Reached.",
          limit_pro: "Pro Plan Limit Reached."
        },
        clients: {
          title: "Clients",
          subtitle: "Manage your client base.",
          blocked_title: "Blocked",
          btn_block: "Block",
          btn_unblock: "Unblock",
          stats_total: "Total",
          stats_ok: "OK", 
          stats_faults: "No-Show"
        },
        reports: {
          title: "Financial Reports",
          subtitle: "Track your numbers.",
          total_revenue: "Total Revenue",
          current_month: "Current Month",
          last_month: "Last Month",
          last_3_months: "Last 3 Months",
          custom: "Custom",
          real_data: "Real Data",
          ticket_avg: "Avg Ticket",
          top_services: "Top Services",
          daily_revenue: "Daily Revenue",
          no_data: "No data yet.",
          revenue: "Revenue",
          appointments: "Appointments"
        },
        settings: {
          profile_title: "Business Profile",
          profile_desc: "How clients see your business.",
          business_name: "Business Name",
          slug_label: "Booking Link",
          banner_label: "Banner (Image URL)",
          btn_save_profile: "Save Profile",
          hours_title: "Operating Hours",
          hours_desc: "When are you open.",
          btn_save_hours: "Save Hours",
          closed: "Closed"
        }
      },
      landing: {
        plans: {
          title: "Investment that pays off instantly",
          subtitle: "Choose the right plan.",
          per_month: "/mo",
          monthly: "Monthly",
          yearly: "Yearly",
          free: {
            title: "Cleverya Free",
            desc: "Start and feel the value.",
            item_1: "Up to 50 bookings/mo",
            cta: "Start Free"
          },
          pro: {
            badge: "MOST POPULAR",
            title: "Cleverya Pro",
            desc: "For independent pros.",
            cta: "Subscribe Pro"
          },
          business: {
            title: "Cleverya Business",
            desc: "For studios and clinics.",
            cta: "Subscribe Business"
          },
          features: {
            unlimited_app: "Unlimited Appointments",
            pro_reports: "Basic Reports",
            no_branding: "No Branding",
            everything_pro: "Everything in Pro",
            multi_prof: "Up to 3 Pros",
            adv_reports: "Advanced Reports",
            locations: "Unlimited Pros & Locations"
          },
          compare: {
            title: "Comparison",
            feature: "Feature",
            all: "All",
            others: "Others",
            charged_separately: "Charged separately"
          }
        },
        nav: {
          how: "How it works",
          benefits: "Benefits",
          plans: "Pricing",
          login: "Login",
          start: "Start Free"
        },
        hero: {
          badge: "#1 App for Independent Pros",
          title_1: "Your schedule full.",
          title_highlight: "Your time,",
          title_2: "organized.",
          subtitle: "The complete platform for Psychologists, Barbers, and Consultants.",
          cta: "Create Free Account",
          micro: "No credit card required"
        },
        pain: {
          badge: "THE PROBLEM",
          title: "Losing money being disorganized?",
          item_1: "WhatsApp full of messages",
          item_2: "Client No-Shows",
          item_3: "Constant interruptions during service",
          item_4: "No financial control",
        },
        how: {
          title: "How it works?",
          subtitle: "Simple, fast, and designed for those who are always attending.",
          step_1_title: "Register services",
          step_1_desc: "Set prices and hours.",
          step_2_title: "Share link",
          step_2_desc: "Send it on WhatsApp or Instagram.",
          step_3_title: "Get bookings",
          step_3_desc: "Clients book themselves."
        },
        benefits: {
          title_1: "Professionalism that",
          title_highlight: "wins clients",
          item_1: "24/7 Booking Link",
          item_2: "Email & WhatsApp Reminders",
          item_3: "Financial Management",
          item_4: "Client History"
        },
        versatility: {
            badge: "VERSATILITY",
            title: "Made for",
            title_highlight: "your success",
            subtitle: "Tools adapted to scale your business, whatever your field."
        },
        niches: {
            barber_title: "Barbershops & Salons",
            barber_desc: "Organized schedule by barber and automatic commissions.",
            health_title: "Psychologists & Therapists",
            health_desc: "Secure records and reduced patient no-shows.",
            trainer_title: "Personal Trainers",
            trainer_desc: "Manage students, assessments and recurring payments.",
            consultant_title: "Consultants & Lawyers",
            consultant_desc: "Meetings scheduled without endless email exchanges."
        },
        floating: {
            new_app: "New Appointment",
            confirmed: "Confirmed",
            revenue_week: "Revenue (Week)",
            revenue_today: "Revenue (Today)"
        },
        cta_final: {
          title: "Professionalize today.",
          subtitle: "Join thousands of pros.",
          btn: "Create Free Account"
        },
        footer: {
          copy: "© 2025 Cleverya. All rights reserved.",
          terms: "Terms",
          privacy: "Privacy",
          instagram: "Instagram"
        }
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt', // Se o idioma do usuário for Japonês, cai em Português
    supportedLngs: ['pt', 'en'], // Lista explícita do que você suporta
    
    // Configuração do Detector (Opcional, mas melhora a experiência)
    detection: {
      order: ['localStorage', 'navigator'], // 1º Vê se já tem salvo, 2º Vê o navegador
      caches: ['localStorage'], // Salva a escolha do usuário na memória do navegador
    },

    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;