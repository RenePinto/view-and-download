import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, FileSpreadsheet, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import * as XLSX from "xlsx";

interface RowData {
  id: number;
  categoria: string;
  funcionalidade: string;
  escopoCliente: string;
  statusTec: string;
  metodoShift: string;
  obsNegocio: string;
  obsTecnica: string;
  viewSugerida: string;
  camposMinimos: string;
  obsJustificativa: string;
}

const rawData: RowData[] = [
  { id: 2, categoria: "Acesso", funcionalidade: "Perfis de Acesso", escopoCliente: "Sim", statusTec: "Parcial", metodoShift: "Apenas Tipo", obsNegocio: "Controle granular de permissões por usuário. Deve ser possível configurar se um usuário pode: Ver Preços, Cadastrar Pedidos, Imprimir Laudos ou apenas Visualizar.", obsTecnica: "Shift só retorna o Tipo de Usuário (Ex: 4). A tabela de permissões deve ser gerida localmente pelo Portal.", viewSugerida: "VPortalPerfisAcesso_perfis_de_acesso_id2", camposMinimos: "UsuarioId, Login, Nome, Email, TipoUsuario, Perfis, Permissoes, Unidade, Ativo", obsJustificativa: "View para detalhar perfis/permissões além do 'Tipo' retornado pela API." },
  { id: 4, categoria: "Dashboard", funcionalidade: "Filtros de Busca", escopoCliente: "Sim", statusTec: "Adapt", metodoShift: "WsListaPacMedicoNome", obsNegocio: "Deve permitir busca combinada por: Período, Número da Guia, Nome do Paciente, Referência, Local de Atendimento e Situação do Exame.", obsTecnica: "Campos retornam no payload, mas API não filtra na origem. Solicitar à Shift inclusão dos parâmetros de busca (Server-side).", viewSugerida: "VPortalDashboardConsolidado_filtros_de_busca_id4", camposMinimos: "OsId, CodigoOs, DataCadastro, HoraCadastro, OsStatus, PacienteNome, PacienteCpf, SolicitanteNome, NumeroGuia, FontePagadora, ProcedimentoMnemonico, ProcedimentoStatus", obsJustificativa: "View consolidada para consultas e filtros do dashboard." },
  { id: 5, categoria: "Dashboard", funcionalidade: "Status/Contadores", escopoCliente: "Sim", statusTec: "Parcial", metodoShift: "WsGetListaExPaciente", obsNegocio: "Exibir resumo: \"X de Y exames prontos\". Código de cores: 🟠 Aguardando, 🔵 Processamento, 🟢 Liberado.", obsTecnica: "A API retorna status numérico. O portal deve contar e agrupar para exibir resumo visual.", viewSugerida: "VPortalDashboardConsolidado_status_contadores_id5", camposMinimos: "OsId, CodigoOs, OsStatus, PacienteNome, ProcedimentoMnemonico, ProcedimentoStatus, DataPromessa, Setor", obsJustificativa: "View consolidada para consultas e filtros do dashboard." },
  { id: 6, categoria: "Dashboard", funcionalidade: "Botão Resultados", escopoCliente: "Sim", statusTec: "Parcial", metodoShift: "status", obsNegocio: "O botão \"Abrir Resultados\" só habilita se houver exame com status \"Verde\" (Liberado).", obsTecnica: "Lógica Front-end: Valida o array de exames retornado.", viewSugerida: "VPortalResultados_botao_resultados_id6", camposMinimos: "OsId, CodigoOs, ProcedimentoId, StatusResultado, DataLiberacao, UrlPdf, HashDocumento", obsJustificativa: "View para expor resultados e/ou URLs de laudo." },
  { id: 7, categoria: "Dashboard", funcionalidade: "Editar Guia", escopoCliente: "Sim", statusTec: "GAP Crítico", metodoShift: "GAP (Order)", obsNegocio: "Permite editar dados cadastrais. Regra: Não pode editar exames em andamento ou prontos.", obsTecnica: "Crítico. API atual é apenas leitura. Falta método UpdateOrder ou HL7.", viewSugerida: "VPortalDashboardConsolidado_editar_guia_id7", camposMinimos: "OsId, CodigoOs, OsStatus, PacienteNome, ProcedimentoMnemonico, ProcedimentoStatus", obsJustificativa: "View consolidada para consultas e filtros do dashboard." },
  { id: 9, categoria: "Dashboard", funcionalidade: "Detalhes (Gaveta)", escopoCliente: "Sim", statusTec: "Parcial", metodoShift: "WsGetListaExPaciente", obsNegocio: "Gaveta com detalhes extras: Valor Individual, Data de Entrega Real e Tipo de Amostra/Material.", obsTecnica: "Data e Amostra retornam. Preço é um GAP (API não traz preço).", viewSugerida: "VPortalAmostrasEtiquetas_detalhes_gaveta_id9", camposMinimos: "OsId, AmostraId, CodigoBarra, MaterialNome, ConservanteNome, EtiquetaEpl, Setor, DataColeta", obsJustificativa: "View para amostras e etiquetas por OS/procedimento." },
  { id: 10, categoria: "Dashboard", funcionalidade: "Cores de DATA", escopoCliente: "Sim", statusTec: "Parcial", metodoShift: "dataPrevisao", obsNegocio: "🟡 Amarelo = Data Prevista (Estimativa), 🟣 Roxo = Data de Entrega (Compromisso Real).", obsTecnica: "Lógica Portal: API traz os dois campos; sistema aplica regra de cor.", viewSugerida: "VPortalDashboardConsolidado_cores_de_data_id10", camposMinimos: "OsId, CodigoOs, OsStatus, PacienteNome, ProcedimentoStatus, DataPromessa, HoraPromessa, Setor", obsJustificativa: "View consolidada para consultas e filtros do dashboard." },
  { id: 11, categoria: "Dashboard", funcionalidade: "Impressão Checkbox", escopoCliente: "Sim", statusTec: "Parcial", metodoShift: "urlPdf", obsNegocio: "Selecionar múltiplos exames via checkbox e gerar PDF único ou ZIP com laudos selecionados.", obsTecnica: "Front envia IDs; Middleware baixa PDFs das URLs e agrupa.", viewSugerida: "VPortalDashboardConsolidado_impressao_checkbox_id11", camposMinimos: "OsId, CodigoOs, PacienteNome, ProcedimentoMnemonico, ProcedimentoStatus", obsJustificativa: "View consolidada para consultas e filtros do dashboard." },
  { id: 12, categoria: "Dashboard", funcionalidade: "Agente EPL", escopoCliente: "Sim", statusTec: "GAP Crítico", metodoShift: "GAP (Driver)", obsNegocio: "Middleware local para impressão direta em impressoras térmicas (Zebra/Argox) sem diálogo do Windows.", obsTecnica: "Crítico. Shift não tem endpoint ZPL/EPL. Portal deve gerar código internamente.", viewSugerida: "VPortalAmostrasEtiquetas_agente_epl_id12", camposMinimos: "OsId, AmostraId, CodigoBarra, MaterialNome, EtiquetaEpl, Setor, ProcedimentoMnemonico", obsJustificativa: "View para amostras e etiquetas por OS/procedimento." },
  { id: 16, categoria: "Catálogo", funcionalidade: "Bloqueio de Itens", escopoCliente: "Sim", statusTec: "GAP Crítico", metodoShift: "GAP (Contrato)", obsNegocio: "Exames não contratados aparecem em Cinza (Bloqueado) e não podem ser selecionados.", obsTecnica: "Crítico. API traz todos os exames. Necessário tabela auxiliar de permissões.", viewSugerida: "VPortalBloqueioProcedimento_bloqueio_de_itens_id16", camposMinimos: "ProcedimentoId, ProcedimentoMnemonico, ProcedimentoDescricao, Bloqueado, MotivoBloqueio", obsJustificativa: "View para regras de bloqueio/contrato por procedimento." },
  { id: 17, categoria: "Orçamentos", funcionalidade: "Simulação (Preço)", escopoCliente: "Sim", statusTec: "GAP Crítico", metodoShift: "GAP (Financ.)", obsNegocio: "Orçamento Rápido: seleciona exames e exibe valor total (R$) com tabela de preço do cliente.", obsTecnica: "Crítico. API NÃO RETORNA PREÇO. Necessário endpoint de Tabela de Preços.", viewSugerida: "VPortal_orcamentos_simulacao_preco_id17", camposMinimos: "OsId, CodigoOs", obsJustificativa: "Necessário detalhar campos conforme GAP." },
  { id: 18, categoria: "Cadastro", funcionalidade: "Check-in Paciente", escopoCliente: "Sim", statusTec: "GAP Crítico", metodoShift: "GAP (Order)", obsNegocio: "Cadastro manual + seleção de exames para gerar novo pedido (OS). Gera etiqueta ao final.", obsTecnica: "Integração de criação de pedido já sendo desenvolvida no Fastcomm. A validar.", viewSugerida: "VPortalCheckin_check_in_paciente_id18", camposMinimos: "OsId, CodigoOs, CheckinStatus, CheckinDataHora, CheckinUsuario, Unidade, Origem", obsJustificativa: "View ajuda a exibir status/histórico. Para executar check-in, precisa API." },
  { id: 21, categoria: "Logística", funcionalidade: "Enviar Lote", escopoCliente: "Sim", statusTec: "GAP Crítico", metodoShift: "GAP (Logística)", obsNegocio: "Despacho: seleciona guias, clica \"Enviar Lote\", altera status e gera protocolo de transporte.", obsTecnica: "Crítico. Não há endpoint para \"Fechar Lote\" ou gerar protocolo.", viewSugerida: "VPortalLogistica_enviar_lote_id21", camposMinimos: "LoteId, NumeroLote, StatusLote, DataCriacao, OsId, AmostraId, CodigoBarra, Destino", obsJustificativa: "View para controle de lotes/logística (leitura). Ações exigem API." },
  { id: 22, categoria: "Logística", funcionalidade: "Menu Amostras", escopoCliente: "Sim", statusTec: "Parcial", metodoShift: "WsGetListaExPaciente", obsNegocio: "Relatório de logística do tubo. Filtros: Data, Paciente, Referência, Lote e Situação.", obsTecnica: "Filtrar retorno onde status condiz com etapa de coleta/triagem.", viewSugerida: "VPortalAmostrasEtiquetas_menu_amostras_id22", camposMinimos: "OsId, AmostraId, CodigoBarra, MaterialNome, EtiquetaEpl, Setor, DataColeta, ProcedimentoMnemonico", obsJustificativa: "View para amostras e etiquetas por OS/procedimento." },
  { id: 23, categoria: "Logística", funcionalidade: "Menu Exames", escopoCliente: "Sim", statusTec: "Parcial", metodoShift: "WsGetListaExPaciente", obsNegocio: "Relatório analítico agrupado por Paciente > Exames. Colunas: Exame, Status, Data e Valor.", obsTecnica: "Filtrar retorno por status analítico e agrupar por codPaciente.", viewSugerida: "VPortal_logistica_menu_exames_id23", camposMinimos: "OsId, CodigoOs", obsJustificativa: "Necessário detalhar campos conforme GAP." },
  { id: 24, categoria: "Logística", funcionalidade: "Menu Resultados", escopoCliente: "Sim", statusTec: "Parcial", metodoShift: "WsGetListaExPaciente", obsNegocio: "Relatório de entrega final. Filtros: Período e Flags (Não Impressos / Portal).", obsTecnica: "Filtrar retorno onde urlPdf != null (Laudos disponíveis).", viewSugerida: "VPortalResultados_menu_resultados_id24", camposMinimos: "OsId, ProcedimentoId, ProcedimentoMnemonico, StatusResultado, DataLiberacao, UrlPdf", obsJustificativa: "View para expor resultados e/ou URLs de laudo." },
  { id: 25, categoria: "Logística", funcionalidade: "Etiquetas em Massa", escopoCliente: "Sim", statusTec: "GAP Crítico", metodoShift: "GAP (EPL)", obsNegocio: "Selecionar múltiplos tubos via checkbox e reimprimir etiquetas em lote.", obsTecnica: "Mesmo GAP do Agente EPL. Falta endpoint para gerar string ZPL.", viewSugerida: "VPortalAmostrasEtiquetas_etiquetas_em_massa_id25", camposMinimos: "OsId, AmostraId, CodigoBarra, MaterialNome, EtiquetaEpl, Setor, ProcedimentoMnemonico", obsJustificativa: "View para amostras e etiquetas por OS/procedimento." },
  { id: 26, categoria: "Logística", funcionalidade: "Protocolo (PDF)", escopoCliente: "Sim", statusTec: "Adapt", metodoShift: "Gerar Local", obsNegocio: "PDF (\"Folha de Rosto\") ao fechar lote, listando amostras e pacientes. Código de barras do lote.", obsTecnica: "Shift não gera PDF via API. Portal deve gerar com base nos itens do lote.", viewSugerida: "VPortalLogistica_protocolo_pdf_id26", camposMinimos: "LoteId, NumeroLote, StatusLote, DataCriacao, OsId, AmostraId, CodigoBarra, Destino", obsJustificativa: "View para controle de lotes/logística (leitura)." },
  { id: 27, categoria: "Resultados", funcionalidade: "Download PDF", escopoCliente: "Sim", statusTec: "Adapt", metodoShift: "urlPdf", obsNegocio: "Baixar laudo assinado digitalmente. API retorna arquivo em Base64 para download direto.", obsTecnica: "Shift retorna URL. Portal deve baixar e converter para Base64.", viewSugerida: "VPortalResultados_download_pdf_id27", camposMinimos: "OsId, ProcedimentoId, StatusResultado, DataLiberacao, UrlPdf, HashDocumento", obsJustificativa: "View para expor resultados e/ou URLs de laudo." },
  { id: 28, categoria: "Resultados", funcionalidade: "Download ZIP", escopoCliente: "Sim", statusTec: "Parcial", metodoShift: "Lógica Mid.", obsNegocio: "Download em massa: selecionar exames e baixar ZIP com PDFs nomeados corretamente.", obsTecnica: "Portal itera URLs, baixa arquivos e compacta em ZIP.", viewSugerida: "VPortalResultados_download_zip_id28", camposMinimos: "OsId, ProcedimentoId, StatusResultado, DataLiberacao, UrlPdf", obsJustificativa: "View para expor resultados e/ou URLs de laudo." },
  { id: 31, categoria: "Fora Escopo", funcionalidade: "Módulo Financeiro", escopoCliente: "Não", statusTec: "FORA", metodoShift: "", obsNegocio: "Faturas, Boletos e Contas a Pagar/Receber. Removido a pedido do cliente.", obsTecnica: "Removido.", viewSugerida: "VPortal_fora_escopo_modulo_financeiro_id31", camposMinimos: "—", obsJustificativa: "Fase 2. View opcional." },
  { id: 32, categoria: "Fora Escopo", funcionalidade: "BI / Dashboard", escopoCliente: "Não", statusTec: "FORA", metodoShift: "", obsNegocio: "Gráficos gerenciais. Previsto para Fase 2.", obsTecnica: "Fase 2.", viewSugerida: "VPortalDashboardConsolidado_bi_dashboard_id32", camposMinimos: "—", obsJustificativa: "Fase 2. View opcional." },
  { id: 33, categoria: "Fora Escopo", funcionalidade: "Visualização Imagem", escopoCliente: "Não", statusTec: "FORA", metodoShift: "", obsNegocio: "Visualizador PACS/DICOM. Previsto para Fase 2.", obsTecnica: "Fase 2.", viewSugerida: "VPortal_fora_escopo_visualizacao_imagem_id33", camposMinimos: "—", obsJustificativa: "Fase 2. View opcional." },
  { id: 34, categoria: "Fora Escopo", funcionalidade: "B2C (Paciente)", escopoCliente: "Não", statusTec: "FORA", metodoShift: "", obsNegocio: "Portal para paciente final. Escopo atual é B2B.", obsTecnica: "Fase 2.", viewSugerida: "VPortal_fora_escopo_b2c_paciente_id34", camposMinimos: "—", obsJustificativa: "Fase 2. View opcional." },
];

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  "Parcial": { bg: "bg-blue-100 text-blue-800 border-blue-200", text: "text-blue-700", label: "Parcial" },
  "Adapt": { bg: "bg-violet-100 text-violet-800 border-violet-200", text: "text-violet-700", label: "Adaptação" },
  "GAP Crítico": { bg: "bg-orange-100 text-orange-800 border-orange-200", text: "text-orange-700", label: "GAP Crítico" },
  "FORA": { bg: "bg-gray-100 text-gray-500 border-gray-200", text: "text-gray-500", label: "Fora do Escopo" },
};

const categoriaColors: Record<string, string> = {
  "Acesso": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Dashboard": "bg-sky-50 text-sky-700 border-sky-200",
  "Catálogo": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Orçamentos": "bg-amber-50 text-amber-700 border-amber-200",
  "Cadastro": "bg-rose-50 text-rose-700 border-rose-200",
  "Logística": "bg-teal-50 text-teal-700 border-teal-200",
  "Resultados": "bg-purple-50 text-purple-700 border-purple-200",
  "Fora Escopo": "bg-gray-50 text-gray-500 border-gray-200",
};

const Index = () => {
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const categorias = useMemo(() => [...new Set(rawData.map((r) => r.categoria))], []);
  const statuses = useMemo(() => [...new Set(rawData.map((r) => r.statusTec))], []);

  const filtered = useMemo(() => {
    return rawData.filter((r) => {
      const matchSearch =
        search === "" ||
        r.funcionalidade.toLowerCase().includes(search.toLowerCase()) ||
        r.obsNegocio.toLowerCase().includes(search.toLowerCase()) ||
        r.viewSugerida.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategoria === "all" || r.categoria === filterCategoria;
      const matchStatus = filterStatus === "all" || r.statusTec === filterStatus;
      return matchSearch && matchCat && matchStatus;
    });
  }, [search, filterCategoria, filterStatus]);

  const summary = useMemo(() => {
    const total = rawData.length;
    const gap = rawData.filter((r) => r.statusTec === "GAP Crítico").length;
    const parcial = rawData.filter((r) => r.statusTec === "Parcial").length;
    const adapt = rawData.filter((r) => r.statusTec === "Adapt").length;
    const fora = rawData.filter((r) => r.statusTec === "FORA").length;
    return { total, gap, parcial, adapt, fora };
  }, []);

  const downloadXLSX = () => {
    const exportData = filtered.map((r) => ({
      ID: r.id,
      Categoria: r.categoria,
      Funcionalidade: r.funcionalidade,
      "Escopo Cliente": r.escopoCliente,
      "Status Técnico": r.statusTec,
      "Método Shift": r.metodoShift,
      "Observação Negócio": r.obsNegocio,
      "Observação Técnica": r.obsTecnica,
      "View Sugerida": r.viewSugerida,
      "Campos Mínimos": r.camposMinimos,
      "Justificativa": r.obsJustificativa,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Views Sugeridas");
    ws["!cols"] = [
      { wch: 5 }, { wch: 14 }, { wch: 22 }, { wch: 10 }, { wch: 14 },
      { wch: 22 }, { wch: 60 }, { wch: 60 }, { wch: 45 }, { wch: 60 }, { wch: 45 },
    ];
    XLSX.writeFile(wb, "CTC_Fastcomm_Views_Sugeridas_GAP.xlsx");
  };

  const downloadCSV = () => {
    const headers = ["ID","Categoria","Funcionalidade","Escopo Cliente","Status Técnico","Método Shift","Observação Negócio","Observação Técnica","View Sugerida","Campos Mínimos","Justificativa"];
    const rows = filtered.map((r) =>
      [r.id, r.categoria, r.funcionalidade, r.escopoCliente, r.statusTec, r.metodoShift, `"${r.obsNegocio}"`, `"${r.obsTecnica}"`, r.viewSugerida, `"${r.camposMinimos}"`, `"${r.obsJustificativa}"`].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "CTC_Fastcomm_Views_Sugeridas_GAP.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[#004B8D] text-primary-foreground">
        <div className="max-w-[1600px] mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img src={`${import.meta.env.BASE_URL}logo-ctc.png`} alt="CTC Health Intelligence" className="h-16 rounded-lg" />
              <div className="hidden sm:block h-10 w-px bg-white/30" />
              <img src={`${import.meta.env.BASE_URL}logo-fastcomm.png`} alt="Fastcomm" className="hidden sm:block h-12 rounded-lg" />
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={downloadCSV}
                variant="outline"
                size="sm"
                className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button
                onClick={downloadXLSX}
                size="sm"
                className="bg-[hsl(168,72%,40%)] hover:bg-[hsl(168,72%,35%)] text-white gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Title area */}
      <div className="bg-[#003f75] text-primary-foreground pb-8 pt-4">
        <div className="max-w-[1600px] mx-auto px-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-[Montserrat]">
            Views Sugeridas por GAP — Status Técnico
          </h1>
          <p className="mt-2 text-sm text-blue-100 max-w-3xl">
            Levantamento técnico realizado pelo <strong>Fastcomm</strong> para o projeto
            <strong> CTC Health Intelligence</strong>. Mapeamento de funcionalidades, GAPs de API e
            views de banco de dados sugeridas para o Portal do Cliente.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-[1600px] mx-auto px-6 -mt-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <SummaryCard label="Total Itens" value={summary.total} color="bg-[#004B8D]" />
          <SummaryCard label="GAP Crítico" value={summary.gap} color="bg-orange-500" />
          <SummaryCard label="Parcial" value={summary.parcial} color="bg-blue-500" />
          <SummaryCard label="Adaptação" value={summary.adapt} color="bg-violet-500" />
          <SummaryCard label="Fora Escopo" value={summary.fora} color="bg-gray-400" />
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-[1600px] mx-auto px-6 mt-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar funcionalidade, view ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card"
            />
          </div>
          <div className="flex gap-3 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[160px] bg-card">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] bg-card">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} de {rawData.length} itens
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1600px] mx-auto px-6 mt-4 pb-12">
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="w-10 font-semibold text-foreground">ID</TableHead>
                <TableHead className="font-semibold text-foreground">Categoria</TableHead>
                <TableHead className="font-semibold text-foreground">Funcionalidade</TableHead>
                <TableHead className="font-semibold text-foreground text-center w-20">Escopo</TableHead>
                <TableHead className="font-semibold text-foreground">Status Técnico</TableHead>
                <TableHead className="font-semibold text-foreground">Método Shift</TableHead>
                <TableHead className="font-semibold text-foreground">View Sugerida</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <>
                  <TableRow
                    key={row.id}
                    className={`cursor-pointer transition-colors ${expandedRow === row.id ? "bg-muted/40" : ""} ${row.statusTec === "FORA" ? "opacity-60" : ""}`}
                    onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs font-medium ${categoriaColors[row.categoria] || ""}`}>
                        {row.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{row.funcionalidade}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${row.escopoCliente === "Sim" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {row.escopoCliente === "Sim" ? "✓" : "✗"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs font-semibold border ${statusColors[row.statusTec]?.bg || "bg-gray-100 text-gray-600"}`}>
                        {statusColors[row.statusTec]?.label || row.statusTec}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground max-w-[160px] truncate">{row.metodoShift || "—"}</TableCell>
                    <TableCell className="text-xs font-mono text-[hsl(168,72%,35%)] max-w-[200px]">
                      <span className="break-all">{row.viewSugerida}</span>
                    </TableCell>
                    <TableCell>
                      {expandedRow === row.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedRow === row.id && (
                    <TableRow key={`${row.id}-detail`} className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={8}>
                        <div className="py-3 px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Observação Negócio</span>
                            <p className="mt-1 text-sm text-foreground leading-relaxed">{row.obsNegocio}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Observação Técnica</span>
                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{row.obsTecnica}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campos Mínimos</span>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {row.camposMinimos.split(",").map((c, i) => (
                                <Badge key={i} variant="outline" className="text-xs font-mono bg-card">
                                  {c.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Justificativa</span>
                            <p className="mt-1 text-sm text-foreground">{row.obsJustificativa}</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[hsl(213,76%,22%)] text-blue-200 py-6">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo-ctc.png" alt="CTC" className="h-8 rounded bg-white/90 px-2 py-0.5" />
            <span className="text-xs">×</span>
            <img src="/logo-fastcomm.png" alt="Fastcomm" className="h-7 rounded" />
          </div>
          <p className="text-xs text-center sm:text-right">
            Documento confidencial — CTC Health Intelligence & Fastcomm © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

const SummaryCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="bg-card rounded-xl border shadow-sm p-4 flex items-center gap-4">
    <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
      {value}
    </div>
    <span className="text-sm font-medium text-muted-foreground">{label}</span>
  </div>
);

export default Index;
