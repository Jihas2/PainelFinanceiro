"use client";

import { useEffect, useState } from "react";

export type Contrato = {
  id: number;
  nome: string;
  categoria: string;
  descricao: string | null;
  valor: number;
  inicio: string | null;
  fim: string | null;
  ativo: boolean;
  pdf_nome: string | null;
  pdf_tamanho: number | null;
};

export default function EditarContratoModal({
  contrato,
  categorias,
  onClose,
  onSalvar,
}: {
  contrato: Contrato;
  categorias: string[];
  onClose: () => void;
  onSalvar: (c: Contrato) => void;
}) {
  const [nome, setNome] = useState(contrato.nome);
  const [categoria, setCategoria] = useState(contrato.categoria);
  const [descricao, setDescricao] = useState(contrato.descricao || "");
  const [valor, setValor] = useState(String(contrato.valor || ""));
  const [inicio, setInicio] = useState(contrato.inicio || "");
  const [fim, setFim] = useState(contrato.fim || "");
  const [ativo, setAtivo] = useState(contrato.ativo);
  const [pdfNovo, setPdfNovo] = useState<File | null>(null);
  const [removerPdf, setRemoverPdf] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    const form = new FormData();
    form.set("nome", nome);
    form.set("categoria", categoria);
    form.set("descricao", descricao);
    form.set("valor", valor || "0");
    form.set("inicio", inicio);
    form.set("fim", fim);
    form.set("ativo", String(ativo));
    if (pdfNovo) form.set("pdf", pdfNovo);
    if (removerPdf && !pdfNovo) form.set("removerPdf", "true");

    const res = await fetch(`/api/contratos/${contrato.id}`, {
      method: "PATCH",
      body: form,
    });
    setEnviando(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErro(d.error || "Erro ao salvar");
      return;
    }
    const atualizado = await res.json();
    onSalvar(atualizado);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-100">Editar contrato</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-slate-200 text-xl leading-none w-7 h-7 flex items-center justify-center rounded hover:bg-surfaceAlt"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form onSubmit={salvar} className="space-y-3">
          <Campo label="Nome / Cliente">
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="input-modal"
            />
          </Campo>

          <Campo label="Categoria / Empresa">
            <input
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              list="categorias-edit"
              placeholder="Ex: Ativ, Hex..."
              required
              className="input-modal"
            />
            <datalist id="categorias-edit">
              {categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Campo>

          <Campo label="Descrição">
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="input-modal resize-y"
            />
          </Campo>

          <Campo label="Valor (R$)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="input-modal"
            />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Início">
              <input
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="input-modal"
              />
            </Campo>
            <Campo label="Fim">
              <input
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                className="input-modal"
              />
            </Campo>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4"
            />
            Contrato ativo
          </label>

          {/* PDF */}
          <div className="bg-background border border-border rounded-md p-3">
            <p className="text-xs uppercase tracking-wide text-muted mb-2">Arquivo PDF</p>
            {contrato.pdf_nome && !pdfNovo && !removerPdf && (
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-slate-300 truncate">📄 {contrato.pdf_nome}</span>
                <button
                  type="button"
                  onClick={() => setRemoverPdf(true)}
                  className="text-xs text-red-400 hover:text-red-300 ml-2 shrink-0"
                >
                  Remover
                </button>
              </div>
            )}
            {removerPdf && !pdfNovo && (
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-amber-400">⚠ PDF será removido ao salvar</span>
                <button
                  type="button"
                  onClick={() => setRemoverPdf(false)}
                  className="text-xs text-blue-400 hover:text-blue-300 ml-2"
                >
                  Desfazer
                </button>
              </div>
            )}
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfNovo(e.target.files?.[0] || null)}
              className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-accent file:text-white file:cursor-pointer hover:file:bg-blue-600"
            />
            {pdfNovo && (
              <p className="text-xs text-emerald-400 mt-2">
                Novo: {pdfNovo.name} ({(pdfNovo.size / 1024).toFixed(0)} KB)
              </p>
            )}
            <p className="text-xs text-muted mt-2">Máximo 5 MB</p>
          </div>

          {erro && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
              {erro}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-surfaceAlt hover:bg-slate-700 text-slate-200 text-sm font-medium py-2.5 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 bg-accent hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-md transition-colors"
            >
              {enviando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>

        <style jsx>{`
          :global(.input-modal) {
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
          :global(.input-modal:focus) {
            border-color: #3b82f6;
          }
        `}</style>
      </div>
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
