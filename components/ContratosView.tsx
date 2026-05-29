"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatarReal, formatarData } from "@/lib/format";
import EditarContratoModal, { type Contrato } from "./EditarContratoModal";

type FiltroStatus = "todos" | "ativos" | "inativos";

export default function ContratosView() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("__todas__");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [editando, setEditando] = useState<Contrato | null>(null);

  // Form de novo contrato
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [pdf, setPdf] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/contratos")
      .then((r) => r.json())
      .then(setContratos)
      .finally(() => setCarregando(false));
  }, []);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    contratos.forEach((c) => set.add(c.categoria || "Geral"));
    return Array.from(set).sort();
  }, [contratos]);

  // Pré-preenche o campo categoria com a aba ativa
  useEffect(() => {
    if (categoriaAtiva !== "__todas__" && !categoria) {
      setCategoria(categoriaAtiva);
    }
  }, [categoriaAtiva]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtrados = useMemo(() => {
    let lista = contratos;
    if (categoriaAtiva !== "__todas__") {
      lista = lista.filter((c) => (c.categoria || "Geral") === categoriaAtiva);
    }
    if (filtroStatus === "ativos") lista = lista.filter((c) => c.ativo);
    if (filtroStatus === "inativos") lista = lista.filter((c) => !c.ativo);
    return lista;
  }, [contratos, categoriaAtiva, filtroStatus]);

  const totais = useMemo(() => {
    const escopo =
      categoriaAtiva === "__todas__"
        ? contratos
        : contratos.filter((c) => (c.categoria || "Geral") === categoriaAtiva);
    const ativos = escopo.filter((c) => c.ativo);
    const inativos = escopo.length - ativos.length;
    const somaAtivos = ativos.reduce((s, c) => s + (c.valor || 0), 0);
    return { ativos: ativos.length, inativos, somaAtivos };
  }, [contratos, categoriaAtiva]);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    const form = new FormData();
    form.set("nome", nome);
    form.set("categoria", categoria || "Geral");
    form.set("descricao", descricao);
    form.set("valor", valor || "0");
    form.set("inicio", inicio);
    form.set("fim", fim);
    form.set("ativo", String(ativo));
    if (pdf) form.set("pdf", pdf);

    const res = await fetch("/api/contratos", { method: "POST", body: form });
    setEnviando(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErro(d.error || "Erro ao salvar");
      return;
    }
    const novo: Contrato = await res.json();
    setContratos((prev) => [novo, ...prev]);
    setNome("");
    setDescricao("");
    setValor("");
    setInicio("");
    setFim("");
    setAtivo(true);
    setPdf(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    // mantém a categoria pra facilitar cadastros em sequência
  }

  async function alternar(c: Contrato) {
    const res = await fetch(`/api/contratos/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !c.ativo }),
    });
    if (res.ok) {
      const atualizado = await res.json();
      setContratos((prev) => prev.map((x) => (x.id === c.id ? atualizado : x)));
    }
  }

  async function remover(id: number) {
    if (!confirm("Remover este contrato? Esta ação não pode ser desfeita.")) return;
    const res = await fetch(`/api/contratos/${id}`, { method: "DELETE" });
    if (res.ok) setContratos((prev) => prev.filter((c) => c.id !== id));
  }

  function aoSalvarEdicao(atualizado: Contrato) {
    setContratos((prev) => prev.map((c) => (c.id === atualizado.id ? atualizado : c)));
    setEditando(null);
  }

  return (
    <div className="space-y-6">
      {/* Abas por categoria */}
      <div className="bg-surface border border-border rounded-xl p-2 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setCategoriaAtiva("__todas__")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            categoriaAtiva === "__todas__"
              ? "bg-accent text-white"
              : "text-slate-300 hover:bg-surfaceAlt"
          }`}
        >
          Todas
          <span className="ml-2 text-xs opacity-75">({contratos.length})</span>
        </button>
        {categorias.map((cat) => {
          const count = contratos.filter((c) => (c.categoria || "Geral") === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                categoriaAtiva === cat
                  ? "bg-accent text-white"
                  : "text-slate-300 hover:bg-surfaceAlt"
              }`}
            >
              {cat}
              <span className="ml-2 text-xs opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Ativos" value={String(totais.ativos)} accent="emerald" />
        <Stat label="Inativos" value={String(totais.inativos)} accent="slate" />
        <Stat label="Valor total (ativos)" value={formatarReal(totais.somaAtivos)} accent="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <section className="bg-surface border border-border rounded-xl p-6 lg:col-span-1">
          <h3 className="text-base font-semibold text-slate-100 mb-4">Novo contrato</h3>
          <form onSubmit={adicionar} className="space-y-3">
            <Campo label="Nome / Cliente">
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Ex: Contrato de prestação..."
                className="input"
              />
            </Campo>

            <Campo label="Categoria / Empresa">
              <input
                type="text"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                list="categorias-novas"
                required
                placeholder="Ex: Ativ, Hex..."
                className="input"
              />
              <datalist id="categorias-novas">
                {categorias.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <p className="text-xs text-muted mt-1">
                Digite uma categoria existente ou crie uma nova
              </p>
            </Campo>

            <Campo label="Descrição">
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                placeholder="Detalhes do contrato..."
                className="input resize-y"
              />
            </Campo>

            <Campo label="Valor (R$)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="input"
              />
            </Campo>

            <div className="grid grid-cols-2 gap-3">
              <Campo label="Início">
                <input
                  type="date"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  className="input"
                />
              </Campo>
              <Campo label="Fim">
                <input
                  type="date"
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                  className="input"
                />
              </Campo>
            </div>

            <Campo label="Arquivo PDF (opcional)">
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdf(e.target.files?.[0] || null)}
                className="text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-accent file:text-white file:cursor-pointer hover:file:bg-blue-600 w-full"
              />
              {pdf && (
                <p className="text-xs text-emerald-400 mt-1">
                  {pdf.name} ({(pdf.size / 1024).toFixed(0)} KB)
                </p>
              )}
              <p className="text-xs text-muted mt-1">Máximo 5 MB</p>
            </Campo>

            <label className="flex items-center gap-2 text-sm text-slate-300 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="w-4 h-4"
              />
              Contrato ativo
            </label>

            {erro && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-accent hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-md transition-colors"
            >
              {enviando ? "Salvando..." : "Adicionar Contrato"}
            </button>
          </form>
        </section>

        {/* Lista */}
        <section className="bg-surface border border-border rounded-xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-base font-semibold text-slate-100">
              {categoriaAtiva === "__todas__" ? "Todos os contratos" : `Contratos ${categoriaAtiva}`}
            </h3>
            <div className="flex gap-1.5 bg-background border border-border rounded-md p-1">
              {(["todos", "ativos", "inativos"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroStatus(f)}
                  className={`px-3 py-1 text-xs rounded transition-colors capitalize ${
                    filtroStatus === f
                      ? "bg-accent text-white"
                      : "text-muted hover:text-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {carregando && <p className="text-sm text-muted italic">Carregando...</p>}
          {!carregando && filtrados.length === 0 && (
            <p className="text-sm text-muted italic text-center py-12">
              Nenhum contrato encontrado
            </p>
          )}

          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {filtrados.map((c) => (
              <article
                key={c.id}
                className={`bg-background border border-border rounded-lg p-4 border-l-4 ${
                  c.ativo ? "border-l-emerald-500" : "border-l-slate-500 opacity-80"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-100">{c.nome}</h4>
                    <p className="text-xs text-muted mt-0.5">{c.categoria || "Geral"}</p>
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      c.ativo
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                        : "bg-slate-800 text-muted border border-slate-700"
                    }`}
                  >
                    {c.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>

                {c.descricao && (
                  <p className="text-sm text-slate-300 mb-3 leading-relaxed whitespace-pre-line">
                    {c.descricao}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted mb-3">
                  {c.valor > 0 && (
                    <span>
                      <strong className="text-slate-300">Valor:</strong> {formatarReal(c.valor)}
                    </span>
                  )}
                  {c.inicio && (
                    <span>
                      <strong className="text-slate-300">Início:</strong> {formatarData(c.inicio)}
                    </span>
                  )}
                  {c.fim && (
                    <span>
                      <strong className="text-slate-300">Fim:</strong> {formatarData(c.fim)}
                    </span>
                  )}
                </div>

                {c.pdf_nome && (
                  <a
                    href={`/api/contratos/${c.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-900 px-3 py-1.5 rounded mb-3 transition-colors"
                  >
                    📄 {c.pdf_nome}
                    {c.pdf_tamanho && (
                      <span className="text-red-400/70">
                        ({(c.pdf_tamanho / 1024).toFixed(0)} KB)
                      </span>
                    )}
                  </a>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setEditando(c)}
                    className="text-xs px-3 py-1.5 rounded font-medium bg-accent hover:bg-blue-600 text-white transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => alternar(c)}
                    className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                      c.ativo
                        ? "bg-amber-600 hover:bg-amber-500 text-white"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    }`}
                  >
                    {c.ativo ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    onClick={() => remover(c.id)}
                    className="text-xs px-3 py-1.5 rounded font-medium bg-slate-700 hover:bg-red-600 text-slate-200 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {editando && (
        <EditarContratoModal
          contrato={editando}
          categorias={categorias}
          onClose={() => setEditando(null)}
          onSalvar={aoSalvarEdicao}
        />
      )}

      <style jsx>{`
        :global(.input) {
          width: 100%;
          background: #0b1120;
          border: 1px solid #1e293b;
          color: #e2e8f0;
          padding: 0.6rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.15s;
        }
        :global(.input:focus) {
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "emerald" | "blue" | "slate";
}) {
  const map = {
    emerald: { border: "border-l-emerald-500", text: "text-emerald-400" },
    blue: { border: "border-l-blue-500", text: "text-blue-400" },
    slate: { border: "border-l-slate-500", text: "text-slate-300" },
  } as const;
  return (
    <div className={`bg-surface border border-border border-l-4 ${map[accent].border} rounded-xl p-5`}>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${map[accent].text}`}>{value}</p>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}
