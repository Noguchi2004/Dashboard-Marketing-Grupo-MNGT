import * as xlsx from 'xlsx';
import { FatoPrevisto, FatoRealizado } from './types';

const normalizeKey = (k: string) => {
  return String(k).toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
};

const normalizeVal = (v: any) => {
  if (v === null || v === undefined) return '';
  return String(v).trim();
};

const parseAmount = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    if (val.toLowerCase().trim() === 'x') return 0;
    const cleaned = val.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

const parseExcelDate = (val: any): Date | null => {
  if (!val) return null;
  if (typeof val === 'number') {
    return new Date(Math.round((val - 25569) * 86400 * 1000));
  }
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const getMacroAccount = (conta: string) => {
  const c = conta.toUpperCase();
  if (c.startsWith('HC')) return 'HC (Despesas c/ Pessoal)';
  if (c.startsWith('OPEX')) {
    if (c.includes('MARTECH')) return 'OPEX MarTech';
    if (c.includes('INSTITUCIONAL')) return 'OPEX Institucional';
    if (c.includes('CULTURA') || c.includes('EB')) return 'OPEX Cultura & EB';
    if (c.includes('CX')) return 'OPEX CX';
    if (c.includes('LANÇAMENTO') || c.includes('LANCAMENTO')) return 'OPEX Lançamentos';
    return 'OPEX (Operacional)';
  }
  if (c.startsWith('CAPEX')) {
    if (c.includes('STAND')) return 'CAPEX Stand';
    if (c.includes('EQUIPAMENTO')) return 'CAPEX Equipamentos';
    return 'CAPEX (Investimento)';
  }
  return 'Outros';
};

const getMonthNum = (monthStr: string): number => {
  const m = monthStr.toLowerCase().substring(0, 3);
  const map: Record<string, number> = {
    jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
    jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12
  };
  return map[m] || 1;
};

export const processExcelFile = async (file: File): Promise<{ previsto: FatoPrevisto[], realizado: FatoRealizado[] }> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = xlsx.read(arrayBuffer, { type: 'array' });
  
  const previsto: FatoPrevisto[] = [];
  const realizado: FatoRealizado[] = [];
  
  const monthTerms = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  console.log(`[Parser] Started parsing file: ${file.name}. Found ${workbook.SheetNames.length} sheets.`);

  for (const sheetName of workbook.SheetNames) {
    const snLower = sheetName.toLowerCase();
    
    // Only process the specific requested sheets
    if (!snLower.includes('controle geral marketing') && !snLower.includes('previsto mkt - geral')) {
      console.log(`[Parser] Sheet "${sheetName}" skipped as it is not one of the allowed target sheets.`);
      continue;
    }

    const isControlSheet = snLower.includes('realizado') || snLower.includes('controle');
    
    // Read as 2D array to find headers dynamically
    const sheetData2D = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: null }) as any[][];
    if (sheetData2D.length === 0) {
      console.log(`[Parser] Sheet "${sheetName}" is empty, skipping.`);
      continue;
    }

    // Find header row based on keyword matches
    let headerRowIndex = 0;
    let maxMatchCount = 0;
    const knownKeywords = ['empresa', 'unidade', 'projeto', 'centro', 'area', 'alocacao', 'tipo', 'conta', 'driver', 'premissas', 'total', 'descricao', 'valor', 'fornecedor', 'status', 'solicitacao', 'pedido', 'pagamento', 'mes', 'lancamento', ...monthTerms];

    for (let i = 0; i < Math.min(sheetData2D.length, 20); i++) {
        const row = sheetData2D[i];
        if (!row || !Array.isArray(row)) continue;
        let matchCount = 0;
        row.forEach(cell => {
            const normalized = normalizeKey(String(cell));
            if (knownKeywords.some(kw => normalized.includes(kw))) {
                matchCount++;
            }
        });
        if (matchCount > maxMatchCount) {
            maxMatchCount = matchCount;
            headerRowIndex = i;
        }
    }

    if (maxMatchCount < 2) {
      console.log(`[Parser] Sheet "${sheetName}" skipped due to low header match count (${maxMatchCount}).`);
      continue;
    }

    console.log(`[Parser] Sheet "${sheetName}": header found at row index ${headerRowIndex} with ${maxMatchCount} matching keywords.`);

    // Now safely read with proper header range
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null, range: headerRowIndex }) as any[];

    if (sheetData.length === 0) continue;

    const firstRow = sheetData[0];
    const keys = Object.keys(firstRow);
    const normalizedKeys = keys.map(normalizeKey);
    const keyMap = Object.fromEntries(keys.map((k, i) => [k, normalizedKeys[i]]));
    
    // Detect Budget vs Control sheet
    const hasMonthColumns = monthTerms.filter(m => normalizedKeys.some(nk => nk.startsWith(m))).length >= 3;
    const isBudgetSheetExplicit = snLower.includes('previsto') || snLower.includes('orçamento') || snLower.includes('orcamento');
    const isBudget = (isBudgetSheetExplicit || hasMonthColumns || normalizedKeys.some(k => k.includes('total_2026') || k.includes('total_anual'))) && !isControlSheet;
    
    console.log(`[Parser] Sheet "${sheetName}": isBudget=${isBudget}, isControlSheet=${isControlSheet}. Processing ${sheetData.length} records.`);

    let validRows = 0;
    
    sheetData.forEach((row, rowIndex) => {
      // Norm row to standard keys
      const normRow: any = {};
      for (const key of keys) {
        if (key.toLowerCase().includes('unnamed')) continue;
        normRow[keyMap[key]] = row[key];
      }
      
      const values = Object.values(normRow).filter(v => v !== null && v !== '');
      if (values.length === 0) return; // Ignore empty rows

      // Get values regardless of Budget/Control
      let empresa = normalizeVal(normRow.empresa || normRow.unidade || normRow.projeto);
      if (!empresa) {
        empresa = 'Não Identificada';
      } else {
        const empLower = empresa.toLowerCase();
        if (empLower === 'ai' || empLower.includes('área incrível') || empLower.includes('area incrivel')) empresa = 'Área Incrível';
        else if (empLower === 'clrc' || empLower.includes('centro logístico') || empLower.includes('centro logistico')) empresa = 'Centro Logístico';
        else if (empLower === 'grupo' || empLower.includes('grupo mngt')) empresa = 'Grupo MNGT';
        else if (empLower === 'ma' || empLower.includes('mais armazém') || empLower.includes('mais armazem')) empresa = 'Mais Armazém';
      }
      
      const centro_custo_area = normalizeVal(normRow.centro_de_custo_area || normRow.centro_de_custo || normRow.area || 'Não Identificado');
      const alocacao_custo = normalizeVal(normRow.alocacao_custo || normRow.alocacao || 'Não Identificado');
      const tipo = normalizeVal(normRow.tipo || 'Não Identificado');
      const conta = normalizeVal(normRow.conta || normRow.descricao || 'Não Identificada');

      if (isBudget) {
        const driver = normalizeVal(normRow.driver_e_premissas || normRow.driver || normRow.premissas || normRow.descricao || '');
        let total_anual = 0;
        const totalKey = normalizedKeys.find(k => k.includes('total'));
        if (totalKey) total_anual = parseAmount(normRow[totalKey]);
        
        let monthPushed = false;
        monthTerms.forEach((m, idx) => {
          // Find actual column key that starts with this month prefix
          const mKey = normalizedKeys.find(k => k.startsWith(m));
          if (mKey && normRow[mKey] !== undefined && normRow[mKey] !== null) {
            const val = parseAmount(normRow[mKey]);
            if (val !== 0) {
              previsto.push({
                id: `P_${sheetName}_${rowIndex}_${m}`,
                origem_aba: sheetName,
                empresa,
                centro_custo_area,
                alocacao_custo,
                tipo,
                conta,
                conta_macro: getMacroAccount(conta),
                driver_premissas: driver,
                mes: m,
                mes_num: idx + 1,
                ano: 2026,
                valor_previsto: val,
                total_anual_informado: total_anual
              });
              monthPushed = true;
            }
          }
        });
        if (monthPushed) validRows++;
      } else {
        const descricao = normalizeVal(normRow.descricao || normRow.detalhe || 'Sem descrição');
        const mesStr = normalizeVal(normRow.mes_lancamento || normRow.mes_de_lancamento || normRow.mes || 'Jan');
        const mes_num = getMonthNum(mesStr);
        const valor = parseAmount(normRow.valor || normRow.realizado || normRow.valor_pago || 0);
        const fornecedor = normalizeVal(normRow.fornecedor || normRow.fornecedores || 'Não Informado');
        
        const statusPed = normalizeVal(normRow.status_do_pedido || normRow.status_pedido || '');
        const statusSol = normalizeVal(normRow.status_da_solicitacao || normRow.status_solicitacao || '');
        const status = normalizeVal(statusPed || statusSol || normRow.status || 'Pendente');
        
        const forma_pagamento = normalizeVal(normRow.forma_de_pagamento || normRow.forma_pagamento || normRow.forma_pgto || 'Boleto');
        
        if (valor !== 0) {
          realizado.push({
            id: `R_${sheetName}_${rowIndex}`,
            origem_aba: sheetName,
            empresa,
            centro_custo_area,
            alocacao_custo,
            descricao,
            mes_lancamento: mesStr,
            mes_num,
            trimestre: Math.ceil(mes_num / 3),
            semestre: mes_num <= 6 ? 1 : 2,
            ano: 2026,
            fornecedor_padronizado: fornecedor.toUpperCase(),
            valor_realizado: valor,
            data_solicitacao: parseExcelDate(normRow.data_da_solicitacao || normRow.data_solicitacao || normRow.data_solic),
            n_solicitacao: String(normRow.numero_da_solicitacao || normRow.n_solicitacao || normRow.num_solicitacao || ''),
            status_solicitacao: statusSol,
            data_pedido: parseExcelDate(normRow.data_do_pedido || normRow.data_pedido),
            n_pedido: String(normRow.numero_do_pedido || normRow.n_pedido || normRow.num_pedido || ''),
            forma_pagamento,
            data_primeiro_pgto: parseExcelDate(normRow.data_do_primeiro_pagamento || normRow.data_primeiro_pgto || normRow.data_primeiro_pagamento),
            data_ultimo_pgto: parseExcelDate(normRow.data_do_ultimo_pagamento || normRow.data_ultimo_pgto || normRow.data_ultimo_pagamento),
            status_pedido: statusPed,
            nf: String(normRow.nf || normRow.nota_fiscal || ''),
            recibo: String(normRow.recibo || ''),
            status_macro: ['pago', 'ag. paagamento', 'recorrente', 'entregue/executado'].some(s => status.toLowerCase().includes(s)) ? 'Pago' : status.toLowerCase().includes('cancelado') ? 'Cancelado' : 'Aberto',
            pagamento_parcelado_flag: forma_pagamento.toLowerCase().includes('parcelado') || forma_pagamento.toLowerCase().includes('x'),
            recorrente_flag: forma_pagamento.toLowerCase().includes('recorrente') || descricao.toLowerCase().includes('mensalidade'),
            conta,
            conta_macro: getMacroAccount(conta),
            tipo
          });
          validRows++;
        }
      }
    });
    
    console.log(`[Parser] Sheet "${sheetName}": Finished processing. Extracted ${validRows} valid rows.`);
  }

  console.log(`[Parser] Data ingestion complete. Total Previsto: ${previsto.length}, Total Realizado: ${realizado.length}`);

  return { previsto, realizado };
};
