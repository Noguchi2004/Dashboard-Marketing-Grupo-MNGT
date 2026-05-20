export interface FatoPrevisto {
  id: string;
  origem_aba: string;
  empresa: string;
  centro_custo_area: string;
  alocacao_custo: string;
  tipo: string;
  conta: string;
  conta_macro: string;
  driver_premissas: string;
  mes: string;
  mes_num: number;
  ano: number;
  valor_previsto: number;
  total_anual_informado: number;
}

export interface FatoRealizado {
  id: string;
  origem_aba: string;
  empresa: string;
  centro_custo_area: string; // derived or mapped
  alocacao_custo: string;
  descricao: string;
  mes_lancamento: string;
  mes_num: number;
  trimestre: number;
  semestre: number;
  ano: number;
  fornecedor_padronizado: string;
  valor_realizado: number;
  data_solicitacao: Date | null;
  n_solicitacao: string;
  status_solicitacao: string;
  data_pedido: Date | null;
  n_pedido: string;
  forma_pagamento: string;
  data_primeiro_pgto: Date | null;
  data_ultimo_pgto: Date | null;
  status_pedido: string;
  nf: string;
  recibo: string;
  status_macro: string;
  pagamento_parcelado_flag: boolean;
  recorrente_flag: boolean;
  conta: string; 
  conta_macro: string;
  tipo: string;
}

export interface FilterState {
  ano: number | 'Todos';
  mes: number | 'Todos';
  empresa: string | 'Todos';
  centro_custo_area: string | 'Todos';
  fornecedor: string | 'Todos';
}

export interface DashboardData {
  previsto: FatoPrevisto[];
  realizado: FatoRealizado[];
}
