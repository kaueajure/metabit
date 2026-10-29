export const MONTHS = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
] as const;

export type MonthKey = typeof MONTHS[number];

export type NaturezaGrupo = 'Pessoal e Encargos' | 'Materiais de Consumo' | 'Serviços e Custeio';

export const FONTES_RECURSO = [
  '1 - Recursos do Tesouro',
  '2 - Fundo Municipal (FMDCA)',
  '3 - Recursos Próprios / Contrapartida',
] as const;

export interface BudgetRow {
  id: string;
  categoria: string;
  fonte: string;
  grupo: NaturezaGrupo;
  mesesExecutados: number;
  values: number[]; // 12 months (index 0 = JAN ... 11 = DEZ)
}

// Item retirado de uma despesa (Etapa 2 -> Vai para o Saldo)
export interface WithdrawalItem {
  id: string;
  fonte: string;
  rowId: string;
  months: number[];
  totalAmount: number;
}

// Item destinado para uma despesa (Etapa 3 -> Consome o Saldo)
export interface AllocationItem {
  id: string;
  fonte: string;
  rowId: string;
  months: number[];
  totalAmount: number;
}

// Registro completo de um Remanejamento salvo no histórico do Plano de Trabalho
export interface RemanejamentoRecord {
  id: string;
  numero: number;
  data: string; // YYYY-MM-DD
  tipoInstrumento: string;
  baseLegal: string;
  fonte: string;
  withdrawals: WithdrawalItem[];
  allocations: AllocationItem[];
}

export const INITIAL_BUDGET_ROWS: BudgetRow[] = [
  // ================= FONTE 1: 1 - Recursos do Tesouro (Exatamente como no print) =================
  {
    id: 'fgts',
    categoria: 'FGTS',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Pessoal e Encargos',
    mesesExecutados: 7,
    values: [523.60, 523.60, 523.60, 523.60, 523.60, 523.60, 523.60, 523.60, 523.60, 523.60, 523.60, 523.60],
  },
  {
    id: 'inss-patronal',
    categoria: 'CONTRIBUIÇÃO AO INSS - COTA PATRONAL',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Pessoal e Encargos',
    mesesExecutados: 7,
    values: [1819.07, 1819.07, 1819.07, 1819.07, 1819.07, 1819.07, 1819.07, 1819.07, 1819.07, 1819.07, 1819.07, 1819.07],
  },
  {
    id: 'pis',
    categoria: 'CONTRIBUIÇÃO AO PIS',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Pessoal e Encargos',
    mesesExecutados: 7,
    values: [65.43, 65.43, 65.43, 65.43, 65.43, 65.43, 65.43, 5.43 + 60, 65.43, 65.43, 65.43, 65.43],
  },
  {
    id: 'indenizacoes',
    categoria: 'INDENIZAÇÕES',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Pessoal e Encargos',
    mesesExecutados: 7,
    values: [2053.33, 2053.33, 2053.33, 2053.33, 2053.33, 2053.33, 2053.33, 2053.33, 2053.33, 2053.33, 2053.33, 2053.33],
  },
  {
    id: 'inss',
    categoria: 'INSS',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Pessoal e Encargos',
    mesesExecutados: 7,
    values: [685.07, 685.07, 685.07, 685.07, 685.07, 685.07, 685.07, 685.07, 685.07, 685.07, 685.07, 685.07],
  },
  {
    id: 'irrf',
    categoria: 'IRRF',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Pessoal e Encargos',
    mesesExecutados: 7,
    values: [446.59, 446.59, 446.59, 446.59, 446.59, 446.59, 446.59, 446.59, 446.59, 446.59, 446.59, 446.59],
  },
  {
    id: 'outras-rh',
    categoria: 'OUTRAS DESPESAS DE RECURSOS HUMANOS',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Pessoal e Encargos',
    mesesExecutados: 7,
    values: [60.38, 60.38, 60.38, 60.38, 60.38, 60.38, 60.38, 60.38, 60.38, 60.38, 60.38, 60.37],
  },
  {
    id: 'diretoria',
    categoria: 'DIRETORIA (Salários e Ordenados)',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Pessoal e Encargos',
    mesesExecutados: 7,
    values: [4933.49, 4933.49, 4933.49, 4933.49, 4933.49, 4933.49, 4933.49, 4933.49, 4933.49, 4933.49, 4933.49, 4933.47],
  },
  {
    id: 'decimo-terceiro',
    categoria: '13º SALÁRIO',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Pessoal e Encargos',
    mesesExecutados: 7,
    values: [553.48, 553.48, 553.48, 553.48, 553.48, 553.48, 553.48, 553.48, 553.48, 553.48, 553.48, 553.49],
  },
  {
    id: 'ferias',
    categoria: 'FÉRIAS',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Pessoal e Encargos',
    mesesExecutados: 7,
    values: [184.80, 184.80, 184.80, 184.80, 184.80, 184.80, 184.80, 184.80, 184.80, 184.80, 184.80, 184.80],
  },
  {
    id: 'vale-alimentacao',
    categoria: 'VALE ALIMENTAÇÃO',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Pessoal e Encargos',
    mesesExecutados: 7,
    values: [520.75, 520.75, 520.75, 520.75, 520.75, 520.75, 520.75, 520.75, 520.75, 520.75, 520.75, 520.74],
  },
  {
    id: 'vale-refeicao',
    categoria: 'VALE REFEIÇÃO',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Pessoal e Encargos',
    mesesExecutados: 7,
    values: [630.00, 630.00, 630.00, 630.00, 630.00, 630.00, 630.00, 630.00, 630.00, 630.00, 630.00, 630.00],
  },
  {
    id: 'internet',
    categoria: 'INTERNET/TV A CABO',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Serviços e Custeio',
    mesesExecutados: 7,
    values: [333.33, 333.33, 333.33, 333.33, 333.33, 333.33, 333.33, 333.33, 333.34, 333.34, 333.34, 333.34],
  },
  {
    id: 'generos-alimenticios',
    categoria: 'GÊNEROS ALIMENTÍCIOS',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Materiais de Consumo',
    mesesExecutados: 7,
    values: [3083.33, 3083.33, 3083.33, 3083.33, 3083.33, 3083.33, 3083.33, 3083.33, 3083.34, 3083.34, 3083.34, 3083.34],
  },
  {
    id: 'material-didatico',
    categoria: 'MATERIAL DIDÁTICO',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Materiais de Consumo',
    mesesExecutados: 7,
    values: [300.00, 300.00, 300.00, 300.00, 300.00, 300.00, 300.00, 300.00, 300.00, 300.00, 300.00, 300.00],
  },
  {
    id: 'epi',
    categoria: 'EQUIPAMENTOS DE SEGURANÇA DO TRABALHO (EPI)',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Materiais de Consumo',
    mesesExecutados: 7,
    values: [30.00, 30.00, 30.00, 30.00, 30.00, 30.00, 30.00, 30.00, 30.00, 30.00, 30.00, 30.00],
  },
  {
    id: 'enxoval',
    categoria: 'ENXOVAL',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Materiais de Consumo',
    mesesExecutados: 7,
    values: [208.33, 208.33, 208.33, 208.33, 208.33, 208.33, 208.33, 208.33, 208.34, 208.34, 208.34, 208.34],
  },
  {
    id: 'outros-materiais',
    categoria: 'OUTROS MATERIAIS',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Materiais de Consumo',
    mesesExecutados: 7,
    values: [458.33, 458.33, 458.33, 458.33, 458.33, 458.33, 458.33, 458.33, 458.34, 458.34, 458.34, 458.34],
  },
  {
    id: 'diversos',
    categoria: 'DIVERSOS',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Materiais de Consumo',
    mesesExecutados: 7,
    values: [165.00, 165.00, 165.00, 165.00, 165.00, 165.00, 165.00, 165.00, 165.00, 165.00, 165.00, 165.00],
  },
  {
    id: 'software',
    categoria: 'SISTEMA DE SOFTWARE',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Serviços e Custeio',
    mesesExecutados: 7,
    values: [583.33, 583.33, 583.33, 583.33, 583.33, 583.33, 583.33, 583.33, 583.34, 583.34, 583.34, 583.34],
  },
  {
    id: 'servicos-pj',
    categoria: 'OUTROS SERVIÇOS DE TERCEIROS PESSOA JURÍDICA',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Serviços e Custeio',
    mesesExecutados: 7,
    values: [1520.68, 1520.68, 1520.68, 1520.68, 1520.68, 1520.68, 1520.68, 1520.68, 1520.68, 1520.68, 1520.68, 1520.67],
  },
  {
    id: 'servicos-pf',
    categoria: 'OUTROS SERVIÇOS DE TERCEIROS PESSOA FÍSICA',
    fonte: '1 - Recursos do Tesouro',
    grupo: 'Serviços e Custeio',
    mesesExecutados: 7,
    values: [291.67, 291.67, 291.67, 291.67, 291.67, 291.67, 291.67, 291.67, 291.66, 291.66, 291.66, 291.66],
  },

  // ================= FONTE 2: 2 - Fundo Municipal (FMDCA) =================
  {
    id: 'fmdca-oficineiros',
    categoria: 'INSTRUTORES DE OFICINAS CULTURAIS (MEI/PJ)',
    fonte: '2 - Fundo Municipal (FMDCA)',
    grupo: 'Serviços e Custeio',
    mesesExecutados: 7,
    values: [2400.00, 2400.00, 2400.00, 2400.00, 2400.00, 2400.00, 2400.00, 2400.00, 2400.00, 2400.00, 2400.00, 2400.00],
  },
  {
    id: 'fmdca-esporte',
    categoria: 'MATERIAL ESPORTIVO E RECREATIVO',
    fonte: '2 - Fundo Municipal (FMDCA)',
    grupo: 'Materiais de Consumo',
    mesesExecutados: 7,
    values: [650.00, 650.00, 650.00, 650.00, 650.00, 650.00, 650.00, 650.00, 650.00, 650.00, 650.00, 650.00],
  },
  {
    id: 'fmdca-uniformes',
    categoria: 'CAMISETAS E UNIFORMES DOS EDUCANDOS',
    fonte: '2 - Fundo Municipal (FMDCA)',
    grupo: 'Materiais de Consumo',
    mesesExecutados: 7,
    values: [400.00, 400.00, 400.00, 400.00, 400.00, 400.00, 400.00, 400.00, 400.00, 400.00, 400.00, 400.00],
  },
  {
    id: 'fmdca-transporte',
    categoria: 'LOCAÇÃO DE TRANSPORTE PARA EVENTOS',
    fonte: '2 - Fundo Municipal (FMDCA)',
    grupo: 'Serviços e Custeio',
    mesesExecutados: 7,
    values: [500.00, 500.00, 500.00, 500.00, 500.00, 500.00, 500.00, 500.00, 500.00, 500.00, 500.00, 500.00],
  },

  // ================= FONTE 3: 3 - Recursos Próprios / Contrapartida =================
  {
    id: 'prop-contador',
    categoria: 'ASSESSORIA CONTÁBIL E JURÍDICA',
    fonte: '3 - Recursos Próprios / Contrapartida',
    grupo: 'Serviços e Custeio',
    mesesExecutados: 7,
    values: [950.00, 950.00, 950.00, 950.00, 950.00, 950.00, 950.00, 950.00, 950.00, 950.00, 950.00, 950.00],
  },
  {
    id: 'prop-limpeza',
    categoria: 'MATERIAL DE HIGIENE E LIMPEZA',
    fonte: '3 - Recursos Próprios / Contrapartida',
    grupo: 'Materiais de Consumo',
    mesesExecutados: 7,
    values: [380.00, 380.00, 380.00, 380.00, 380.00, 380.00, 380.00, 380.00, 380.00, 380.00, 380.00, 380.00],
  },
  {
    id: 'prop-manutencao',
    categoria: 'MANUTENÇÃO PREDIAL E PEQUENOS REPAROS',
    fonte: '3 - Recursos Próprios / Contrapartida',
    grupo: 'Serviços e Custeio',
    mesesExecutados: 7,
    values: [420.00, 420.00, 420.00, 420.00, 420.00, 420.00, 420.00, 420.00, 420.00, 420.00, 420.00, 420.00],
  },
];

// Histórico inicial de remanejamentos já salvos para demonstrar a continuidade cumulativa
export const INITIAL_SAVED_REMANEJAMENTOS: RemanejamentoRecord[] = [
  {
    id: 'rem-1',
    numero: 1,
    data: '2026-09-10',
    tipoInstrumento: 'Termo de Apostilamento',
    baseLegal: 'Apostilamento nº 01/2026 — Art. 57 da Lei 13.019/2014 (Reforço de alimentação em Setembro e Outubro).',
    fonte: '1 - Recursos do Tesouro',
    withdrawals: [
      {
        id: 'w-101',
        fonte: '1 - Recursos do Tesouro',
        rowId: 'indenizacoes',
        months: [8, 9], // SET, OUT (-R$ 500/mês)
        totalAmount: 1000.00,
      },
    ],
    allocations: [
      {
        id: 'a-101',
        fonte: '1 - Recursos do Tesouro',
        rowId: 'generos-alimenticios',
        months: [8, 9], // SET, OUT (+R$ 500/mês)
        totalAmount: 1000.00,
      },
    ],
  },
  {
    id: 'rem-2',
    numero: 2,
    data: '2026-10-15',
    tipoInstrumento: 'Termo de Apostilamento',
    baseLegal: 'Apostilamento nº 02/2026 — Compra de materiais didáticos e EPIs para o encerramento do ano.',
    fonte: '1 - Recursos do Tesouro',
    withdrawals: [
      {
        id: 'w-201',
        fonte: '1 - Recursos do Tesouro',
        rowId: 'servicos-pj',
        months: [9, 10], // OUT, NOV (-R$ 300/mês)
        totalAmount: 600.00,
      },
      {
        id: 'w-202',
        fonte: '1 - Recursos do Tesouro',
        rowId: 'outros-materiais',
        months: [10, 11], // NOV, DEZ (-R$ 200/mês)
        totalAmount: 400.00,
      },
    ],
    allocations: [
      {
        id: 'a-201',
        fonte: '1 - Recursos do Tesouro',
        rowId: 'material-didatico',
        months: [10, 11], // NOV, DEZ (+R$ 350/mês)
        totalAmount: 700.00,
      },
      {
        id: 'a-202',
        fonte: '1 - Recursos do Tesouro',
        rowId: 'epi',
        months: [10, 11], // NOV, DEZ (+R$ 150/mês)
        totalAmount: 300.00,
      },
    ],
  },
];

// Aplica uma lista de Remanejamentos em sequência sobre as linhas originais
export function applyRemanejamentosToPlan(
  baseRows: BudgetRow[],
  remanejamentos: RemanejamentoRecord[]
): Record<string, number[]> {
  const result: Record<string, number[]> = {};
  baseRows.forEach((r) => {
    result[r.id] = [...r.values];
  });

  remanejamentos.forEach((rem) => {
    rem.withdrawals.forEach((w) => {
      if (result[w.rowId] && w.months.length > 0) {
        const perMonth = Math.round((w.totalAmount / w.months.length) * 100) / 100;
        let acc = 0;
        w.months.forEach((mIdx, i) => {
          const deduction =
            i === w.months.length - 1
              ? Math.round((w.totalAmount - acc) * 100) / 100
              : perMonth;
          acc = Math.round((acc + deduction) * 100) / 100;
          result[w.rowId][mIdx] = Math.round((result[w.rowId][mIdx] - deduction) * 100) / 100;
        });
      }
    });

    rem.allocations.forEach((a) => {
      if (result[a.rowId] && a.months.length > 0) {
        const perMonth = Math.round((a.totalAmount / a.months.length) * 100) / 100;
        let acc = 0;
        a.months.forEach((mIdx, i) => {
          const addition =
            i === a.months.length - 1
              ? Math.round((a.totalAmount - acc) * 100) / 100
              : perMonth;
          acc = Math.round((acc + addition) * 100) / 100;
          result[a.rowId][mIdx] = Math.round((result[a.rowId][mIdx] + addition) * 100) / 100;
        });
      }
    });
  });

  return result;
}

export function formatBRL(value: number, showSymbol = false): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value) < 0.005 ? 0 : value);
  return showSymbol ? `R$ ${formatted}` : formatted;
}

export function sumArray(arr: number[]): number {
  return Math.round(arr.reduce((acc, v) => acc + v, 0) * 100) / 100;
}
