import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

export function SEO() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  
  // Detecção segura do idioma
  const currentLang = i18n.language || 'pt';
  const htmlLang = currentLang.startsWith('pt') ? 'pt-BR' : 'en';
  const canonicalUrl = `https://www.cleverya.com${location.pathname}`;

  // Títulos dinâmicos baseados na rota
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/login') return t('auth.login_title', 'Entrar') + ' | Cleverya';
    if (path === '/signup') return t('auth.signup_title', 'Criar Conta') + ' | Cleverya';
    if (path.includes('/dashboard')) return 'Dashboard | Cleverya';
    return t('seo.title', 'Cleverya — Seu tempo, organizado com inteligência');
  };

  // Se for dashboard, instruímos o Google a NÃO indexar (Melhora a "saúde" do SEO técnico)
  const isPrivate = location.pathname.includes('/dashboard') || location.pathname.includes('/success');

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Cleverya",
    "applicationCategory": "BusinessApplication",
    "url": "https://www.cleverya.com",
    "description": t('seo.description', 'Plataforma de agendamento inteligente.'),
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": currentLang.startsWith('pt') ? "BRL" : "USD"
    }
  };

  return (
    <Helmet>
      <html lang={htmlLang} />
      <title>{getPageTitle()}</title>
      <meta name="description" content={t('seo.description', 'Agendamento inteligente e gestão simplificada.')} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Se for privado, bloqueia robôs explicitamente (Evita erro de 'falta de dados') */}
      {isPrivate ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      <meta property="og:locale" content={currentLang.startsWith('pt') ? 'pt_BR' : 'en_US'} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={getPageTitle()} />
      <meta property="og:description" content={t('seo.description')} />
      <meta property="og:site_name" content="Cleverya" />
      
      {/* Script JSON-LD apenas na home para não pesar outras páginas */}
      {location.pathname === '/' && (
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      )}
    </Helmet>
  );
}