import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export function SEO() {
  const { t, i18n } = useTranslation();
  
  // BLINDAGEM: Se i18n.language for undefined, usa 'pt' como padrão para não travar
  const lang = i18n.language || 'pt';
  
  const currentLang = lang.startsWith('pt') ? 'pt_BR' : 'en_US';
  const htmlLang = lang.startsWith('pt') ? 'pt-BR' : 'en';

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Cleverya",
    "applicationCategory": "BusinessApplication",
    "url": "https://www.cleverya.com",
    "description": t('seo.description', { defaultValue: 'Plataforma de agendamento inteligente e gestão de tempo.' }),
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": lang.startsWith('pt') ? "BRL" : "USD"
    }
  };

  return (
    <Helmet>
      <html lang={htmlLang} />
      <title>{t('seo.title', { defaultValue: 'Cleverya — Seu tempo, organizado com inteligência' })}</title>
      <meta name="description" content={t('seo.description', { defaultValue: 'Agendamento inteligente e gestão simplificada.' })} />
      <meta name="keywords" content={t('seo.keywords', { defaultValue: 'agendamento online, gestão de tempo, agenda' })} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://www.cleverya.com" />
      <meta property="og:title" content={t('seo.title')} />
      <meta property="og:description" content={t('seo.description')} />
      <meta property="og:locale" content={currentLang} />
      <meta property="og:site_name" content="Cleverya" />
      <meta property="og:image" content="https://www.cleverya.com/og-image.jpg" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t('seo.title')} />
      <meta name="twitter:description" content={t('seo.description')} />
      <meta name="twitter:image" content="https://www.cleverya.com/og-image.jpg" />

      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}