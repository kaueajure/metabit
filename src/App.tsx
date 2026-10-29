/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  FileText
} from 'lucide-react';
import {
  INITIAL_BUDGET_ROWS,
  INITIAL_SAVED_REMANEJAMENTOS,
  FONTES_RECURSO,
  MONTHS,
  WithdrawalItem,
  AllocationItem,
  RemanejamentoRecord,
  applyRemanejamentosToPlan,
  formatBRL,
  sumArray
} from './data/budgetData';
import { OficioRemanejamentoModal } from './components/OficioRemanejamentoModal';

type ScreenState =
  | 'visualizar'       // Tela padrão do Plano de Aplicação
  | 'lista'            // Lista simples de remanejamentos + botão Novo
  | 'passo1-dados'     // Data, Fonte e Base Legal
  | 'passo2-retirar'   // Retirar (gera Saldo)
  | 'passo3-destinar'; // Destinar Saldo

type CalculationMode = 'por-mes' | 'valor-total';

export default function App() {
  const originalRows = useMemo(() => INITIAL_BUDGET_ROWS, []);

  const [savedRemanejamentos, setSavedRemanejamentos] = useState<RemanejamentoRecord[]>(
    INITIAL_SAVED_REMANEJAMENTOS
  );

  const [screen, setScreen] = useState<ScreenState>('visualizar');
  const [editingRemanejamentoId, setEditingRemanejamentoId] = useState<string | null>(null);
  const [selectedOficioRemanejamento, setSelectedOficioRemanejamento] =
    useState<RemanejamentoRecord | null>(null);

  // Passo 1
  const [dataRemanejamento, setDataRemanejamento] = useState<string>('2026-10-29');
  const [baseLegal, setBaseLegal] = useState<string>('');
  const [selectedFonte, setSelectedFonte] = useState<string>('1 - Recursos do Tesouro');
  const [draftWithdrawals, setDraftWithdrawals] = useState<WithdrawalItem[]>([]);
  const [draftAllocations, setDraftAllocations] = useState<AllocationItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtro da tabela inferior + Data de referência do quadro (sempre inicia com a data atual)
  const [tableFonteFilter, setTableFonteFilter] = useState<string>('1 - Recursos do Tesouro');
  const [viewReferenceDate, setViewReferenceDate] = useState<string>('2026-10-29');
  const [showOnlyChanged, setShowOnlyChanged] = useState<boolean>(false);

  // Campos de lançamento (Passo 2 e 3)
  const [selectedRowId, setSelectedRowId] = useState<string>('indenizacoes');
  const [selectedMonths, setSelectedMonths] = useState<number[]>([8, 9]);
  const [calcMode, setCalcMode] = useState<CalculationMode>('por-mes');
  const [amountInput, setAmountInput] = useState<string>('250,00');

  const formatDateBR = (isoDate: string) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  const lastSavedRemanejamento = useMemo(() => {
    if (savedRemanejamentos.length === 0) return null;
    return savedRemanejamentos[savedRemanejamentos.length - 1];
  }, [savedRemanejamentos]);

  // Limite de data (nunca anterior ao último remanejamento)
  const dateConstraints = useMemo(() => {
    if (!editingRemanejamentoId) {
      return {
        minDate: lastSavedRemanejamento ? lastSavedRemanejamento.data : '2026-08-20',
        maxDate: undefined
      };
    }
    const idx = savedRemanejamentos.findIndex((r) => r.id === editingRemanejamentoId);
    const prevRem = idx > 0 ? savedRemanejamentos[idx - 1] : null;
    const nextRem =
      idx >= 0 && idx < savedRemanejamentos.length - 1 ? savedRemanejamentos[idx + 1] : null;

    return {
      minDate: prevRem ? prevRem.data : '2026-08-20',
      maxDate: nextRem ? nextRem.data : undefined
    };
  }, [editingRemanejamentoId, lastSavedRemanejamento, savedRemanejamentos]);

  // Novo Remanejamento
  const handleStartNew = () => {
    setEditingRemanejamentoId(null);
    const minAllowed = lastSavedRemanejamento ? lastSavedRemanejamento.data : '2026-08-20';
    const today = '2026-10-29';
    setDataRemanejamento(today >= minAllowed ? today : minAllowed);
    setBaseLegal('');
    setSelectedFonte('1 - Recursos do Tesouro');
    setTableFonteFilter('1 - Recursos do Tesouro');
    setDraftWithdrawals([]);
    setDraftAllocations([]);
    setErrorMsg(null);
    setScreen('passo1-dados');
  };

  // Editar Remanejamento existente
  const handleEditExisting = (rem: RemanejamentoRecord) => {
    setEditingRemanejamentoId(rem.id);
    setDataRemanejamento(rem.data);
    setBaseLegal(rem.baseLegal);
    setSelectedFonte(rem.fonte);
    setTableFonteFilter(rem.fonte);
    setDraftWithdrawals(rem.withdrawals.map((w) => ({ ...w, months: [...w.months] })));
    setDraftAllocations(rem.allocations.map((a) => ({ ...a, months: [...a.months] })));

    const firstRow = originalRows.find((r) => r.fonte === rem.fonte);
    if (firstRow) setSelectedRowId(firstRow.id);

    setErrorMsg(null);
    setScreen('passo1-dados');
  };

  const handleDeleteExisting = (id: string) => {
    setSavedRemanejamentos((prev) =>
      prev.filter((r) => r.id !== id).map((r, i) => ({ ...r, numero: i + 1 }))
    );
  };

  // Base cumulativa (sempre inclui alterações dos remanejamentos anteriores)
  const baselineValues = useMemo(() => {
    if (screen === 'visualizar' || screen === 'lista') {
      const origMap: Record<string, number[]> = {};
      originalRows.forEach((r) => {
        origMap[r.id] = [...r.values];
      });
      return origMap;
    }

    if (!editingRemanejamentoId) {
      return applyRemanejamentosToPlan(originalRows, savedRemanejamentos);
    } else {
      const idx = savedRemanejamentos.findIndex((r) => r.id === editingRemanejamentoId);
      const previousOnes = idx > 0 ? savedRemanejamentos.slice(0, idx) : [];
      return applyRemanejamentosToPlan(originalRows, previousOnes);
    }
  }, [screen, editingRemanejamentoId, originalRows, savedRemanejamentos]);

  // Valores calculados na tabela
  const computedPlan = useMemo(() => {
    const valuesMap: Record<string, number[]> = {};
    const changedCellsMap: Record<string, Record<number, number>> = {};

    if (screen === 'visualizar' || screen === 'lista') {
      // Aplica apenas os remanejamentos cuja data seja menor ou igual à data escolhida acima do quadro
      const remanejamentosAteAData = savedRemanejamentos.filter(
        (rem) => !viewReferenceDate || rem.data <= viewReferenceDate
      );
      const applied = applyRemanejamentosToPlan(originalRows, remanejamentosAteAData);
      originalRows.forEach((r) => {
        valuesMap[r.id] = applied[r.id];
        changedCellsMap[r.id] = {};
        r.values.forEach((origVal, mIdx) => {
          const diff = Math.round((applied[r.id][mIdx] - origVal) * 100) / 100;
          if (Math.abs(diff) >= 0.01) changedCellsMap[r.id][mIdx] = diff;
        });
      });
      return { valuesMap, changedCellsMap };
    }

    originalRows.forEach((r) => {
      valuesMap[r.id] = [...(baselineValues[r.id] || r.values)];
      changedCellsMap[r.id] = {};
    });

    draftWithdrawals.forEach((w) => {
      if (valuesMap[w.rowId] && w.months.length > 0) {
        const perMonth = Math.round((w.totalAmount / w.months.length) * 100) / 100;
        let acc = 0;
        w.months.forEach((mIdx, i) => {
          const deduction =
            i === w.months.length - 1
              ? Math.round((w.totalAmount - acc) * 100) / 100
              : perMonth;
          acc = Math.round((acc + deduction) * 100) / 100;
          valuesMap[w.rowId][mIdx] = Math.round((valuesMap[w.rowId][mIdx] - deduction) * 100) / 100;
          changedCellsMap[w.rowId][mIdx] = Math.round(
            ((changedCellsMap[w.rowId][mIdx] || 0) - deduction) * 100
          ) / 100;
        });
      }
    });

    draftAllocations.forEach((a) => {
      if (valuesMap[a.rowId] && a.months.length > 0) {
        const perMonth = Math.round((a.totalAmount / a.months.length) * 100) / 100;
        let acc = 0;
        a.months.forEach((mIdx, i) => {
          const addition =
            i === a.months.length - 1
              ? Math.round((a.totalAmount - acc) * 100) / 100
              : perMonth;
          acc = Math.round((acc + addition) * 100) / 100;
          valuesMap[a.rowId][mIdx] = Math.round((valuesMap[a.rowId][mIdx] + addition) * 100) / 100;
          changedCellsMap[a.rowId][mIdx] = Math.round(
            ((changedCellsMap[a.rowId][mIdx] || 0) + addition) * 100
          ) / 100;
        });
      }
    });

    return { valuesMap, changedCellsMap };
  }, [
    screen,
    viewReferenceDate,
    originalRows,
    savedRemanejamentos,
    baselineValues,
    draftWithdrawals,
    draftAllocations
  ]);

  const handleSelectFonte = (novaFonte: string) => {
    setSelectedFonte(novaFonte);
    setTableFonteFilter(novaFonte);
    const rowsOfFonte = originalRows.filter((r) => r.fonte === novaFonte);
    if (rowsOfFonte.length > 0) setSelectedRowId(rowsOfFonte[0].id);
    setErrorMsg(null);
  };

  const rowsInSelectedFonte = useMemo(() => {
    return originalRows.filter((r) => r.fonte === selectedFonte);
  }, [originalRows, selectedFonte]);

  // Saldo
  const saldoMetrics = useMemo(() => {
    const sourceWithdrawals = draftWithdrawals.filter((w) => w.fonte === selectedFonte);
    const sourceAllocations = draftAllocations.filter((a) => a.fonte === selectedFonte);

    const totalRetirado =
      Math.round(sourceWithdrawals.reduce((acc, w) => acc + w.totalAmount, 0) * 100) / 100;
    const totalDestinado =
      Math.round(sourceAllocations.reduce((acc, a) => acc + a.totalAmount, 0) * 100) / 100;
    const saldoDisponivel = Math.round((totalRetirado - totalDestinado) * 100) / 100;

    return { sourceWithdrawals, sourceAllocations, totalRetirado, totalDestinado, saldoDisponivel };
  }, [draftWithdrawals, draftAllocations, selectedFonte]);

  const liveAmountPreview = useMemo(() => {
    const rawVal = parseFloat(amountInput.replace(/\./g, '').replace(',', '.'));
    const validVal = !isNaN(rawVal) && rawVal > 0 ? rawVal : 0;
    const countMonths = selectedMonths.length;
    if (countMonths === 0 || validVal === 0) return { totalOperation: 0, perMonth: 0 };

    const totalOperation =
      calcMode === 'por-mes'
        ? Math.round(validVal * countMonths * 100) / 100
        : Math.round(validVal * 100) / 100;
    const perMonth = Math.round((totalOperation / countMonths) * 100) / 100;
    return { totalOperation, perMonth };
  }, [amountInput, selectedMonths, calcMode]);

  const toggleMonth = (mIdx: number) => {
    setSelectedMonths((prev) =>
      prev.includes(mIdx)
        ? prev.filter((x) => x !== mIdx)
        : [...prev, mIdx].sort((a, b) => a - b)
    );
  };

  const handleAdvanceFromStep1 = () => {
    if (!dataRemanejamento || dataRemanejamento < dateConstraints.minDate) {
      setErrorMsg(`Data inválida. Mínimo permitido: ${formatDateBR(dateConstraints.minDate)}`);
      return;
    }
    if (dateConstraints.maxDate && dataRemanejamento > dateConstraints.maxDate) {
      setErrorMsg(`Data máxima permitida: ${formatDateBR(dateConstraints.maxDate)}`);
      return;
    }
    if (!baseLegal.trim()) {
      setErrorMsg('Preencha a Base Legal.');
      return;
    }
    setErrorMsg(null);
    setScreen('passo2-retirar');
  };

  // Passo 2: Retirar
  const handleAddWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMonths.length === 0 || liveAmountPreview.totalOperation <= 0) return;

    const rowArr = computedPlan.valuesMap[selectedRowId] || [];
    const insufficientMonth = selectedMonths.find(
      (mIdx) => (rowArr[mIdx] || 0) + 0.005 < liveAmountPreview.perMonth
    );

    if (insufficientMonth !== undefined) {
      setErrorMsg(
        `Saldo insuficiente em ${MONTHS[insufficientMonth]} (Disponível: R$ ${formatBRL(
          rowArr[insufficientMonth] || 0
        )}).`
      );
      return;
    }

    setErrorMsg(null);
    setDraftWithdrawals((prev) => [
      ...prev,
      {
        id: `w-${Date.now()}`,
        fonte: selectedFonte,
        rowId: selectedRowId,
        months: [...selectedMonths],
        totalAmount: liveAmountPreview.totalOperation
      }
    ]);
  };

  // Passo 3: Destinar
  const handleAddAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMonths.length === 0 || liveAmountPreview.totalOperation <= 0) return;

    if (liveAmountPreview.totalOperation > saldoMetrics.saldoDisponivel + 0.005) {
      setErrorMsg(
        `Valor maior que o saldo disponível (R$ ${formatBRL(saldoMetrics.saldoDisponivel)}).`
      );
      return;
    }

    setErrorMsg(null);
    setDraftAllocations((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        fonte: selectedFonte,
        rowId: selectedRowId,
        months: [...selectedMonths],
        totalAmount: liveAmountPreview.totalOperation
      }
    ]);

    const restante = Math.max(
      0,
      Math.round((saldoMetrics.saldoDisponivel - liveAmountPreview.totalOperation) * 100) / 100
    );
    setCalcMode('valor-total');
    setAmountInput(restante.toFixed(2).replace('.', ','));
  };

  // Salvar Remanejamento
  const handleSaveRemanejamento = () => {
    if (draftWithdrawals.length === 0 || Math.abs(saldoMetrics.saldoDisponivel) >= 0.01) return;

    if (editingRemanejamentoId) {
      setSavedRemanejamentos((prev) =>
        prev.map((r) =>
          r.id === editingRemanejamentoId
            ? {
                ...r,
                data: dataRemanejamento,
                baseLegal,
                fonte: selectedFonte,
                withdrawals: draftWithdrawals,
                allocations: draftAllocations
              }
            : r
        )
      );
    } else {
      setSavedRemanejamentos((prev) => [
        ...prev,
        {
          id: `rem-${Date.now()}`,
          numero: prev.length + 1,
          data: dataRemanejamento,
          tipoInstrumento: 'Apostilamento',
          baseLegal,
          fonte: selectedFonte,
          withdrawals: draftWithdrawals,
          allocations: draftAllocations
        }
      ]);
    }
    if (dataRemanejamento > viewReferenceDate) {
      setViewReferenceDate(dataRemanejamento);
    }
    setScreen('visualizar');
  };

  const isInsideWizardPhase =
    screen === 'passo1-dados' ||
    screen === 'passo2-retirar' ||
    screen === 'passo3-destinar';

  const visibleRows = useMemo(() => {
    const activeFilter =
      screen === 'visualizar' || screen === 'lista' ? tableFonteFilter : selectedFonte;
    return originalRows.filter((r) => {
      if (activeFilter !== 'TODAS' && r.fonte !== activeFilter) return false;
      if (showOnlyChanged) {
        const deltas = computedPlan.changedCellsMap[r.id] || {};
        return Object.values(deltas).some((d) => Math.abs(d) >= 0.01);
      }
      return true;
    });
  }, [originalRows, screen, tableFonteFilter, selectedFonte, showOnlyChanged, computedPlan]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] text-slate-800">
      {/* TOP BAR CONTRACT */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-8">
        <a
          href="#inicio"
          onClick={(e) => e.preventDefault()}
          className="text-base font-bold tracking-tight text-slate-700 whitespace-nowrap shrink-0"
        >
          Metabit Sistemas
        </a>

        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600">
          <a href="#1" onClick={(e) => e.preventDefault()} className="hover:text-blue-600 whitespace-nowrap shrink-0">
            Dashboard
          </a>
          <a
            href="#2"
            onClick={(e) => e.preventDefault()}
            className="text-blue-600 font-semibold bg-blue-50 px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0"
          >
            Cadastros
          </a>
          <a href="#3" onClick={(e) => e.preventDefault()} className="hover:text-blue-600 whitespace-nowrap shrink-0">
            Movimentações
          </a>
          <a href="#4" onClick={(e) => e.preventDefault()} className="hover:text-blue-600 whitespace-nowrap shrink-0">
            Prestar Contas
          </a>
          <a href="#5" onClick={(e) => e.preventDefault()} className="hover:text-blue-600 whitespace-nowrap shrink-0">
            Consultas e Relatórios
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-700 leading-tight">Simão Teodoro</div>
            <div className="text-[10px] text-slate-400">ASSOCIACAO BEM COMUM - ABC</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            S
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6">
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs">
          {/* CABEÇALHO DO CARD */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setScreen('visualizar')}
                className="mt-1 p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="text-xs text-slate-400">Visualizar Plano de Trabalho</div>
                <h1 className="text-xl font-bold text-blue-500 tracking-tight">
                  {screen === 'visualizar' ? 'Plano de Aplicação' : 'Remanejamento'}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Plano aprovado em 20/08/2026 14:44</span>
                </div>
              </div>
            </div>

            {screen === 'visualizar' ? (
              <div className="flex items-center gap-2">
                {lastSavedRemanejamento && (
                  <button
                    type="button"
                    onClick={() => setSelectedOficioRemanejamento(lastSavedRemanejamento)}
                    className="px-3.5 py-2 rounded-md text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Relatório / Ofício
                  </button>
                )}
                <button
                  onClick={() => setScreen('lista')}
                  className="px-4 py-2 rounded-md text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Remanejamento
                </button>
              </div>
            ) : (
              <button
                onClick={() => setScreen('visualizar')}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Fechar Remanejamento
              </button>
            )}
          </div>

          {/* =====================================================================
              1. LISTA SIMPLES DE REMANEJAMENTOS + BOTÃO NOVO (SEM O QUADRO ABAIXO)
             ===================================================================== */}
          {screen === 'lista' && (
            <div className="p-6 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700">Remanejamentos Realizados</h2>
                <button
                  type="button"
                  onClick={handleStartNew}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Remanejamento
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400">
                      <th className="py-2.5 px-3 w-16">Nº</th>
                      <th className="py-2.5 px-3 w-28">DATA</th>
                      <th className="py-2.5 px-3 w-56">FONTE DE RECURSO</th>
                      <th className="py-2.5 px-3">BASE LEGAL</th>
                      <th className="py-2.5 px-3 text-right w-32">VALOR (R$)</th>
                      <th className="py-2.5 px-3 text-right w-48">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {savedRemanejamentos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Nenhum remanejamento cadastrado.
                        </td>
                      </tr>
                    ) : (
                      savedRemanejamentos.map((rem) => {
                        const total = sumArray(rem.withdrawals.map((w) => w.totalAmount));
                        return (
                          <tr key={rem.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-slate-700">#{rem.numero}</td>
                            <td className="py-2.5 px-3 font-mono-tabular text-slate-700">
                              {formatDateBR(rem.data)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{rem.fonte}</td>
                            <td className="py-2.5 px-3 text-slate-600 truncate max-w-md">
                              {rem.baseLegal}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono-tabular font-bold text-slate-800">
                              {formatBRL(total)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOficioRemanejamento(rem)}
                                  className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 border border-slate-300 rounded font-medium flex items-center gap-1 cursor-pointer"
                                  title="Emitir Ofício de Remanejamento"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Ofício</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditExisting(rem)}
                                  className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded font-medium cursor-pointer"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExisting(rem.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BARRA ENXUTA DE ETAPAS (Quando está criando ou editando) */}
          {isInsideWizardPhase && (
            <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setScreen('lista')}
                  className="text-slate-500 hover:text-slate-800 font-medium mr-2 cursor-pointer"
                >
                  ← Lista
                </button>

                <button
                  type="button"
                  onClick={() => setScreen('passo1-dados')}
                  className={`px-3 py-1.5 rounded font-semibold cursor-pointer ${
                    screen === 'passo1-dados'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  1. Dados
                </button>

                <button
                  type="button"
                  onClick={handleAdvanceFromStep1}
                  className={`px-3 py-1.5 rounded font-semibold cursor-pointer ${
                    screen === 'passo2-retirar'
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  2. Retirar (Origem)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (dataRemanejamento < dateConstraints.minDate || !baseLegal.trim()) {
                      handleAdvanceFromStep1();
                      return;
                    }
                    setScreen('passo3-destinar');
                    if (saldoMetrics.saldoDisponivel > 0) {
                      setCalcMode('valor-total');
                      setAmountInput(saldoMetrics.saldoDisponivel.toFixed(2).replace('.', ','));
                    }
                  }}
                  className={`px-3 py-1.5 rounded font-semibold cursor-pointer ${
                    screen === 'passo3-destinar'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  3. Destinar (Para onde vai)
                </button>
              </div>

              {/* Resumo enxuto de Saldo */}
              <div className="flex items-center gap-4 text-xs bg-white px-3.5 py-1.5 rounded border border-slate-200">
                <span>
                  Retirado:{' '}
                  <strong className="font-mono-tabular text-red-600">
                    R$ {formatBRL(saldoMetrics.totalRetirado)}
                  </strong>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  Destinado:{' '}
                  <strong className="font-mono-tabular text-emerald-600">
                    R$ {formatBRL(saldoMetrics.totalDestinado)}
                  </strong>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  Saldo:{' '}
                  <strong
                    className={`font-mono-tabular ${
                      saldoMetrics.saldoDisponivel > 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    R$ {formatBRL(saldoMetrics.saldoDisponivel)}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {/* =====================================================================
              PASSO 1: APENAS DATA E BASE LEGAL (SEM QUADRO ABAIXO)
             ===================================================================== */}
          {screen === 'passo1-dados' && (
            <div className="p-6 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-5 rounded-lg border border-slate-200">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data (Mín: {formatDateBR(dateConstraints.minDate)})
                  </label>
                  <input
                    type="date"
                    min={dateConstraints.minDate}
                    max={dateConstraints.maxDate}
                    value={dataRemanejamento}
                    onChange={(e) => {
                      setDataRemanejamento(e.target.value);
                      setErrorMsg(null);
                    }}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-2 font-medium"
                  />
                </div>

                <div className="md:col-span-7">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Base Legal / Justificativa
                  </label>
                  <input
                    type="text"
                    value={baseLegal}
                    onChange={(e) => {
                      setBaseLegal(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Ex: Apostilamento nº 03/2026 - Art. 57 Lei 13.019"
                    className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleAdvanceFromStep1}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Avançar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="mt-2 text-xs text-red-600 font-semibold">{errorMsg}</div>
              )}
            </div>
          )}

          {/* =====================================================================
              PASSO 2 (RETIRAR) E PASSO 3 (DESTINAR) — SEM QUADRO ABAIXO
             ===================================================================== */}
          {(screen === 'passo2-retirar' || screen === 'passo3-destinar') && (
            <div className="p-6 bg-slate-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Formulário Esquerdo */}
                <form
                  onSubmit={
                    screen === 'passo2-retirar' ? handleAddWithdrawal : handleAddAllocation
                  }
                  className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {screen === 'passo2-retirar'
                          ? 'Despesa para retirar:'
                          : 'Despesa para receber:'}
                      </label>
                      <select
                        value={selectedRowId}
                        onChange={(e) => setSelectedRowId(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-2 font-semibold text-slate-800"
                      >
                        {rowsInSelectedFonte.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.categoria} (R${' '}
                            {formatBRL(sumArray(computedPlan.valuesMap[r.id] || r.values))})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Fonte de Recurso:
                      </label>
                      <select
                        value={selectedFonte}
                        onChange={(e) => handleSelectFonte(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-700"
                      >
                        {FONTES_RECURSO.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Meses */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">Meses:</label>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedMonths([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
                          }
                          className="text-blue-600 hover:underline"
                        >
                          Todos
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedMonths([])}
                          className="text-slate-500 hover:underline"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                      {MONTHS.map((m, idx) => {
                        const isSelected = selectedMonths.includes(idx);
                        const val = computedPlan.valuesMap[selectedRowId]?.[idx] || 0;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => toggleMonth(idx)}
                            className={`py-2 px-1 rounded border text-center cursor-pointer transition-colors ${
                              isSelected
                                ? screen === 'passo2-retirar'
                                  ? 'bg-red-600 text-white border-red-600 font-bold'
                                  : 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="text-[10px]">{m}</div>
                            <div
                              className={`text-[9px] font-mono-tabular truncate ${
                                isSelected ? 'text-white/90' : 'text-slate-400'
                              }`}
                            >
                              {formatBRL(val)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Valor + Botão */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end pt-1">
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Modo:
                      </label>
                      <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setCalcMode('por-mes')}
                          className={`py-1 rounded text-[11px] font-semibold cursor-pointer ${
                            calcMode === 'por-mes'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-500'
                          }`}
                        >
                          Por mês
                        </button>
                        <button
                          type="button"
                          onClick={() => setCalcMode('valor-total')}
                          className={`py-1 rounded text-[11px] font-semibold cursor-pointer ${
                            calcMode === 'valor-total'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-500'
                          }`}
                        >
                          Total
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-5">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700">Valor (R$):</label>
                        {screen === 'passo3-destinar' && saldoMetrics.saldoDisponivel > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setCalcMode('valor-total');
                              setAmountInput(
                                saldoMetrics.saldoDisponivel.toFixed(2).replace('.', ',')
                              );
                            }}
                            className="text-[10px] text-emerald-700 hover:underline font-semibold"
                          >
                            Usar Saldo ({formatBRL(saldoMetrics.saldoDisponivel)})
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono-tabular font-bold border border-slate-300 rounded"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <button
                        type="submit"
                        className={`w-full py-2 px-3 text-white text-xs font-semibold rounded flex items-center justify-center gap-1 cursor-pointer ${
                          screen === 'passo2-retirar'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{screen === 'passo2-retirar' ? 'Retirar' : 'Destinar'}</span>
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="text-xs text-red-600 font-semibold flex items-center justify-between">
                      <span>{errorMsg}</span>
                      <button type="button" onClick={() => setErrorMsg(null)}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </form>

                {/* Lista Direita (Itens retirados ou destinados + Botão Avançar/Salvar) */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <span className="text-xs font-bold text-slate-700">
                        {screen === 'passo2-retirar'
                          ? `Retiradas (${saldoMetrics.sourceWithdrawals.length})`
                          : `Destinações (${saldoMetrics.sourceAllocations.length})`}
                      </span>
                      <span className="text-xs font-mono-tabular font-bold">
                        Saldo: R$ {formatBRL(saldoMetrics.saldoDisponivel)}
                      </span>
                    </div>

                    {screen === 'passo2-retirar' ? (
                      saldoMetrics.sourceWithdrawals.length === 0 ? (
                        <div className="py-10 text-center text-xs text-slate-400">
                          Nenhuma retirada adicionada.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 max-h-[200px] overflow-y-auto">
                          {saldoMetrics.sourceWithdrawals.map((w) => {
                            const cat =
                              originalRows.find((r) => r.id === w.rowId)?.categoria || '';
                            return (
                              <div
                                key={w.id}
                                className="py-2 flex items-center justify-between text-xs"
                              >
                                <div className="truncate pr-2">
                                  <span className="font-semibold text-slate-700">{cat}</span>{' '}
                                  <span className="text-slate-400 text-[11px]">
                                    ({w.months.map((m) => MONTHS[m]).join(', ')})
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-mono-tabular font-bold text-red-600">
                                    - {formatBRL(w.totalAmount)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDraftWithdrawals((prev) =>
                                        prev.filter((i) => i.id !== w.id)
                                      )
                                    }
                                    className="text-slate-400 hover:text-red-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : saldoMetrics.sourceAllocations.length === 0 ? (
                      <div className="py-10 text-center text-xs text-slate-400">
                        Nenhuma destinação adicionada.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-[200px] overflow-y-auto">
                        {saldoMetrics.sourceAllocations.map((a) => {
                          const cat =
                            originalRows.find((r) => r.id === a.rowId)?.categoria || '';
                          return (
                            <div
                              key={a.id}
                              className="py-2 flex items-center justify-between text-xs"
                            >
                              <div className="truncate pr-2">
                                <span className="font-semibold text-slate-700">{cat}</span>{' '}
                                <span className="text-slate-400 text-[11px]">
                                  ({a.months.map((m) => MONTHS[m]).join(', ')})
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono-tabular font-bold text-emerald-600">
                                  + {formatBRL(a.totalAmount)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraftAllocations((prev) =>
                                      prev.filter((i) => i.id !== a.id)
                                    )
                                  }
                                  className="text-slate-400 hover:text-red-600 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    {screen === 'passo2-retirar' ? (
                      <button
                        type="button"
                        disabled={saldoMetrics.totalRetirado <= 0}
                        onClick={() => {
                          setScreen('passo3-destinar');
                          if (saldoMetrics.saldoDisponivel > 0) {
                            setCalcMode('valor-total');
                            setAmountInput(
                              saldoMetrics.saldoDisponivel.toFixed(2).replace('.', ',')
                            );
                          }
                        }}
                        className={`px-4 py-2 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                          saldoMetrics.totalRetirado > 0
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <span>Ir para Destinar Saldo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          saldoMetrics.totalRetirado <= 0 ||
                          Math.abs(saldoMetrics.saldoDisponivel) >= 0.01
                        }
                        onClick={handleSaveRemanejamento}
                        className={`px-4 py-2 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                          saldoMetrics.totalRetirado > 0 &&
                          Math.abs(saldoMetrics.saldoDisponivel) < 0.01
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Finalizar Remanejamento</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              QUADRO DO PLANO DE APLICAÇÃO (APARECE SOMENTE NA TELA DE VISUALIZAÇÃO /
              DEPOIS QUE FINALIZAR O REMANEJAMENTO)
             ===================================================================== */}
          {screen === 'visualizar' && (
            <div className="px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-bold text-slate-700">Ano 2026</span>

                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-slate-500">Data:</label>
                    <input
                      type="date"
                      value={viewReferenceDate}
                      onChange={(e) => setViewReferenceDate(e.target.value)}
                      className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left border-collapse min-w-[1180px]">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-slate-200 text-[11px] font-bold text-slate-400">
                      <th className="py-2.5 px-3 min-w-[260px]">CATEGORIA</th>
                      <th className="py-2.5 px-2 min-w-[160px]">FONTE</th>
                      {MONTHS.map((m) => (
                        <th key={m} className="py-2.5 px-2 text-right min-w-[74px]">
                          {m}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-right min-w-[90px]">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11.5px]">
                    {visibleRows.map((row) => {
                      const currentMonthValues = computedPlan.valuesMap[row.id] || row.values;
                      const currentTotal = sumArray(currentMonthValues);

                      return (
                        <tr key={row.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-bold text-slate-700">{row.categoria}</td>
                          <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">
                            {row.fonte}
                          </td>

                          {currentMonthValues.map((val, mIdx) => (
                            <td
                              key={mIdx}
                              className="py-2.5 px-2 text-right font-mono-tabular text-slate-600"
                            >
                              {formatBRL(val)}
                            </td>
                          ))}

                          <td className="py-2.5 px-3 text-right font-mono-tabular font-bold text-slate-800">
                            {formatBRL(currentTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RODAPÉ */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setScreen(isInsideWizardPhase ? 'lista' : 'visualizar')}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
            >
              Voltar
            </button>

            {screen === 'visualizar' && (
              <button
                type="button"
                onClick={() => setScreen('lista')}
                className="px-4 py-2 text-xs font-medium text-blue-600 bg-white border border-blue-500 rounded-md hover:bg-blue-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editar
              </button>
            )}
          </div>
        </div>
      </main>

      {/* MODAL DO MODELO DE RELATÓRIO / OFÍCIO DE REMANEJAMENTO */}
      {selectedOficioRemanejamento && (
        <OficioRemanejamentoModal
          remanejamento={selectedOficioRemanejamento}
          allRows={originalRows}
          onClose={() => setSelectedOficioRemanejamento(null)}
        />
      )}
    </div>
  );
}
