import React, { useState } from 'react';
import { Printer, X, Edit3, Check } from 'lucide-react';
import {
  RemanejamentoRecord,
  BudgetRow,
  MONTHS,
  formatBRL
} from '../data/budgetData';

interface OficioRemanejamentoModalProps {
  remanejamento: RemanejamentoRecord;
  allRows: BudgetRow[];
  onClose: () => void;
}

const MESES_EXTENSO = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro'
];

function formatDataExtenso(isoDate: string): string {
  if (!isoDate) return '09 de outubro de 2026';
  const [y, m, d] = isoDate.split('-').map(Number);
  const mesNome = MESES_EXTENSO[(m || 1) - 1] || 'outubro';
  const diaStr = String(d || 1).padStart(2, '0');
  return `${diaStr} de ${mesNome} de ${y}`;
}

export function OficioRemanejamentoModal({
  remanejamento,
  allRows,
  onClose
}: OficioRemanejamentoModalProps) {
  const [isEditingFields, setIsEditingFields] = useState(false);

  // Campos editáveis do cabeçalho do Ofício (padrão igual ao PDF enviado)
  const [numeroOficio, setNumeroOficio] = useState(
    remanejamento.numero === 1 ? '147/2026' : `${146 + remanejamento.numero}/2026`
  );
  const [destinatario, setDestinatario] = useState(
    'À Prefeitura Municipal de Guapiaçu – SP'
  );
  const [assunto, setAssunto] = useState(
    'Solicitação de remanejamento no Plano de Aplicação – Termo de Fomento nº 10/2026'
  );
  const [cidadeData, setCidadeData] = useState(
    `São José do Rio Preto, ${formatDataExtenso(remanejamento.data)}.`
  );
  const [mostrarMesesNoItem, setMostrarMesesNoItem] = useState(false);
  const [mostrarLinhaTotal, setMostrarLinhaTotal] = useState(false);

  const getCategoryName = (rowId: string) => {
    const found = allRows.find((r) => r.id === rowId);
    if (!found) return rowId;
    return found.categoria;
  };

  const totalSaida = remanejamento.withdrawals.reduce(
    (acc, w) => acc + w.totalAmount,
    0
  );
  const totalEntrada = remanejamento.allocations.reduce(
    (acc, a) => acc + a.totalAmount,
    0
  );

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-6">
      {/* Barra de Ações Superior (Não sai na impressão) */}
      <div className="w-full max-w-[210mm] bg-slate-900 text-white px-4 py-3 rounded-t-lg flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-bold bg-blue-600 px-2.5 py-1 rounded">
            Ofício de Remanejamento #{remanejamento.numero}
          </span>
          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={mostrarLinhaTotal}
              onChange={(e) => setMostrarLinhaTotal(e.target.checked)}
              className="rounded border-slate-600 text-blue-500"
            />
            <span>Exibir linha Total</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={mostrarMesesNoItem}
              onChange={(e) => setMostrarMesesNoItem(e.target.checked)}
              className="rounded border-slate-600 text-blue-500"
            />
            <span>Exibir meses</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditingFields(!isEditingFields)}
            className="px-3 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            {isEditingFields ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Concluir Edição do Cabeçalho</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Nº Ofício / Destinatário</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / Gerar PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FOLHA A4 DO OFÍCIO (Idêntica ao modelo PDF de Guapiaçu 2026) */}
      <div
        id="oficio-printable-area"
        className="w-full max-w-[210mm] bg-white text-black shadow-2xl border border-slate-200 rounded-b-lg px-10 sm:px-16 py-12 flex flex-col justify-between min-h-[297mm]"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        <div className="space-y-6">
          {/* CABEÇALHO COM LOGO DA ABC (ASSOCIAÇÃO BEM COMUM) */}
          <div className="flex items-center gap-4 pb-2">
            {/* Símbolo espiral colorido + sigla ABC fiel ao documento */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-600 to-blue-700 flex items-center justify-center shadow-xs">
                <div className="w-7 h-7 rounded-full bg-amber-100 border-4 border-blue-900/40" />
              </div>
              <div className="h-12 w-px bg-slate-300" />
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <div className="text-2xl tracking-[0.22em] font-light text-slate-500 leading-none">
                  ABC
                </div>
                <div className="text-[8px] tracking-[0.2em] text-slate-400 uppercase mt-1">
                  ASSOCIAÇÃO
                </div>
                <div className="text-[8px] tracking-[0.2em] text-slate-400 uppercase">
                  BEM COMUM
                </div>
              </div>
            </div>
          </div>

          {/* IDENTIFICAÇÃO DO OFÍCIO E DESTINATÁRIO */}
          <div className="space-y-4 text-[15px] leading-relaxed">
            {isEditingFields ? (
              <div
                className="p-3 bg-slate-50 border border-blue-300 rounded space-y-2 text-xs"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">
                      Ofício nº:
                    </label>
                    <input
                      type="text"
                      value={numeroOficio}
                      onChange={(e) => setNumeroOficio(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">
                      Local e Data:
                    </label>
                    <input
                      type="text"
                      value={cidadeData}
                      onChange={(e) => setCidadeData(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">
                    Destinatário:
                  </label>
                  <input
                    type="text"
                    value={destinatario}
                    onChange={(e) => setDestinatario(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">
                    Assunto:
                  </label>
                  <input
                    type="text"
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1 bg-white"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="font-bold leading-snug">
                  <div>Ofício nº {numeroOficio}</div>
                  <div>{destinatario}</div>
                </div>

                <div>Assunto: {assunto}</div>

                <div className="text-right pt-2">{cidadeData}</div>
              </>
            )}

            {/* TEXTO DE QUALIFICAÇÃO DA ENTIDADE */}
            <p className="text-justify indent-16 leading-relaxed pt-2">
              A <strong>ASSOCIAÇÃO BEM COMUM - ABC</strong>, pessoa jurídica, inscrita no
              M.F com o CNPJ sob o nº 35.101.878/0001-06, com sede na Rua Antonio Guerino
              de Lourenço nº 651, Vila Clementina, CEP — 15051-400 nesta cidade de São
              José do Rio Preto – S.P, e-mail: associacao_abc@hotmail.com, representada
              neste ato pelo presidente SR. SILVIO DE OLIVEIRA FACHINI, brasileiro,
              divorciado, residente e domiciliado na Rua Dom Pedro nº 2403 – Vila
              Moreira, nesta cidade de São José do Rio Preto – S.P. – Cep. 15030-500,
              portador do RG nº 25647791 CPF nº 136.641.388-13, vem através deste:
            </p>

            <p className="text-justify indent-8 leading-relaxed">
              Como entidade parceira do Município com o acolhimento no modelo Casa Lar,
              vem respeitosamente solicitar remanejamento de valores no Plano de
              Aplicação, conforme segue:
            </p>

            {/* 1. DO REMANEJAMENTO PROPOSTO */}
            <div className="space-y-3 pt-1">
              <div className="font-normal">1. Do Remanejamento Proposto</div>

              <p className="text-justify leading-relaxed">
                O remanejamento refere-se à realocação de recursos entre categorias
                econômicas já existentes, mantendo-se integralmente o objeto pactuado,
                conforme quadro abaixo:
              </p>

              {/* QUADRO DE SAÍDA E ENTRADA (IDÊNTICO AO PDF) */}
              <div className="pt-1">
                <table
                  className="w-full max-w-[540px] border-collapse border border-black text-[13px]"
                  style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
                >
                  <thead>
                    <tr className="border-b border-black font-bold">
                      <th className="border-r border-black py-1 px-2 text-left">Item</th>
                      <th className="border-r border-black py-1 px-2 text-left w-32">
                        Saída
                      </th>
                      <th className="py-1 px-2 text-left w-32">Entrada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Linhas de Saída (Retiradas no Passo 2) */}
                    {remanejamento.withdrawals.map((w) => (
                      <tr key={w.id} className="border-b border-black">
                        <td className="border-r border-black py-1 px-2">
                          {getCategoryName(w.rowId)}
                          {mostrarMesesNoItem && (
                            <span className="text-[11px] text-slate-600 ml-1">
                              ({w.months.map((m) => MONTHS[m]).join(', ')})
                            </span>
                          )}
                        </td>
                        <td className="border-r border-black py-1 px-2 font-mono-tabular">
                          <div className="flex items-center justify-between">
                            <span>R$</span>
                            <span>{formatBRL(w.totalAmount)}</span>
                          </div>
                        </td>
                        <td className="py-1 px-2" />
                      </tr>
                    ))}

                    {/* Linhas de Entrada (Destinações no Passo 3) */}
                    {remanejamento.allocations.map((a) => (
                      <tr key={a.id} className="border-b border-black">
                        <td className="border-r border-black py-1 px-2">
                          {getCategoryName(a.rowId)}
                          {mostrarMesesNoItem && (
                            <span className="text-[11px] text-slate-600 ml-1">
                              ({a.months.map((m) => MONTHS[m]).join(', ')})
                            </span>
                          )}
                        </td>
                        <td className="border-r border-black py-1 px-2" />
                        <td className="py-1 px-2 font-mono-tabular">
                          <div className="flex items-center justify-between">
                            <span>R$</span>
                            <span>{formatBRL(a.totalAmount)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Linha de Totalização opcional */}
                    {mostrarLinhaTotal && (
                      <tr className="bg-slate-50 font-bold border-b border-black">
                        <td className="border-r border-black py-1 px-2">Total</td>
                        <td className="border-r border-black py-1 px-2 font-mono-tabular">
                          <div className="flex items-center justify-between">
                            <span>R$</span>
                            <span>{formatBRL(totalSaida)}</span>
                          </div>
                        </td>
                        <td className="py-1 px-2 font-mono-tabular">
                          <div className="flex items-center justify-between">
                            <span>R$</span>
                            <span>{formatBRL(totalEntrada)}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. DA JUSTIFICATIVA */}
            <div className="space-y-3 pt-2">
              <div>2. Da Justificativa</div>

              <p className="leading-relaxed">
                O remanejamento se faz necessário em razão de ajustes na execução do
                projeto, visando:
              </p>

              <div className="space-y-0.5 leading-snug">
                <div>Adequação às demandas reais durante a execução</div>
                <div>Otimização dos recursos públicos</div>
                <div>Manutenção da qualidade e continuidade das ações pactuadas</div>
              </div>
            </div>

            {/* FECHO E ASSINATURA */}
            <div className="pt-6 space-y-12">
              <div>Nestes termos, solicita deferimento.</div>

              <div className="flex flex-col items-center justify-center text-center pt-4">
                <div className="w-80 border-t border-black mb-1.5" />
                <div className="font-normal uppercase tracking-wide text-[14px]">
                  ASSOCIAÇÃO BEM COMUM – ABC
                </div>
                <div className="font-normal uppercase text-[14px]">
                  SILVIO OLIVEIRA FACHINI
                </div>
                <div className="font-normal uppercase text-[14px]">
                  - PRESIDENTE -
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RODAPÉ OFICIAL DA FOLHA (Idêntico ao PDF) */}
        <div
          className="pt-8 mt-8 border-t border-slate-100 text-center text-[11px] text-slate-700 leading-snug"
          style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
        >
          <div>
            E-mail: associacao_abc@hotmail.com - CNPJ 35.101.878/0001-06.
          </div>
          <div>São José do Rio Preto/SP.</div>
          <div>Fone: (17) 3353-9878.</div>
        </div>
      </div>
    </div>
  );
}
