import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useCountry() {
  const [currency, setCurrency] = useState<'BRL' | 'USD'>('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function determineCurrency() {
      // 1. CHECAGEM RÁPIDA (Fuso Horário)
      // Funciona instantaneamente no Localhost e para 99% dos brasileiros
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const navLang = navigator.language;

      const isBrazilTimezone = timeZone.includes('Sao_Paulo') || 
                               timeZone.includes('Brazil') || 
                               timeZone.includes('Belem') ||
                               timeZone.includes('Fortaleza') ||
                               timeZone.includes('Manaus') ||
                               timeZone.includes('Recife') ||
                               timeZone.includes('Araguaina') ||
                               timeZone.includes('Maceio') ||
                               timeZone.includes('Bahia') ||
                               timeZone.includes('Cuiaba') ||
                               timeZone.includes('Campo_Grande');

      if (isBrazilTimezone || navLang === 'pt-BR') {
        console.log('Detectado Brasil via Sistema/Fuso:', timeZone);
        setCurrency('BRL');
        setLoading(false);
        return; // Encerra aqui, não gasta API nem tempo
      }

      // 2. FALLBACK DE API (Apenas se o passo 1 falhar/for gringo)
      try {
        const { data, error } = await supabase.functions.invoke('get-location');
        
        if (!error && data?.country === 'BR') {
          setCurrency('BRL');
        } else {
          setCurrency('USD');
        }
      } catch (err) {
        console.error('Erro na API, mantendo USD:', err);
        setCurrency('USD');
      } finally {
        setLoading(false);
      }
    }

    determineCurrency();
  }, []);

  return { currency, loading };
}