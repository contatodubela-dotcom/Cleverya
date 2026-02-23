import React, { forwardRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface ReportProps {
  data: any[]; // Seus dados financeiros
  totalRevenue: number;
  period: string;
}

// Usamos forwardRef para que a biblioteca de impressão consiga "pegar" este componente
export const FinancialReport = forwardRef<HTMLDivElement, ReportProps>((props, ref) => {
  const { user } = useAuth();
  const date = new Date().toLocaleDateString('pt-BR');

  return (
    // A classe 'print:block' faz aparecer na impressão, 'hidden' esconde na tela normal
    // A classe 'print:text-black' garante que o texto saia preto no papel
    <div ref={ref} className="p-10 bg-white text-black font-sans w-full">
      
      {/* Cabeçalho do Relatório */}
      <div className="flex justify-between items-center border-b-2 border-gray-800 pb-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatório Financeiro</h1>
          <p className="text-sm text-gray-600">Gerado via Cleverya App</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold">{user?.user_metadata?.business_name || 'Minha Empresa'}</h2>
          <p className="text-sm text-gray-500">Data: {date}</p>
          <p className="text-sm text-gray-500">Período: {props.period}</p>
        </div>
      </div>

      {/* Resumo */}
      <div className="mb-8 p-4 bg-gray-100 rounded-lg border border-gray-300">
        <h3 className="text-lg font-bold mb-2">Resumo do Período</h3>
        <div className="text-4xl font-bold text-green-700">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(props.totalRevenue)}
        </div>
        <p className="text-sm text-gray-600">Faturamento Total Confirmado</p>
      </div>

      {/* Tabela de Dados */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-400">
            <th className="py-2 font-bold">Data</th>
            <th className="py-2 font-bold">Cliente</th>
            <th className="py-2 font-bold">Serviço</th>
            <th className="py-2 font-bold text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {props.data.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2">{new Date(item.start_time).toLocaleDateString()}</td>
              <td className="py-2">{item.client_name}</td>
              <td className="py-2">{item.service_name}</td>
              <td className="py-2 text-right">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Rodapé */}
      <div className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>Documento gerado automaticamente pela plataforma Cleverya.</p>
        <p>www.cleverya.com</p>
      </div>
    </div>
  );
});

FinancialReport.displayName = 'FinancialReport';