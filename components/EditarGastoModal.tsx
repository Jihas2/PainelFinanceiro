"use client";

import { useState, useEffect } from "react";
import type { Gasto } from "./FinancasView";

export default function EditarGastoModal({
  gasto,
  categorias,
  onClose,
  onSalvar,
}: {
  gasto: Gasto;
  categorias: string[];
  onClose: () => void;
  onSalvar: (g: Gasto) => void;
}) {
  const [descricao, setDescricao] = useState(gasto.descricao);
  const [categoria, setCategoria] = useState(gasto.categoria);
  const [valor, setValor] = useState(String(gasto.valor));
  const [data, setData] = useState(gasto.data);
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
    const res = await fetch(`/api/gastos/${gasto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao,
        categoria,
        valor: parseFloat(valor),
        data,
      }),
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
        className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-100">Editar gasto</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-slate-200 text-xl leading-none w-7 h-7 flex items-center justify-center rounded hover:bg-surfaceAlt"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form onSubmit={salvar} className="space-y-3">
          <label className="block">
            <span className="block text-xs uppercase tracking-wide text-muted mb-1.5">
              Descrição
            </span>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              className="w-full bg-background border border-border text-slate-100 rounded-md px-3 py-2.5 outline-none focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wide text-muted mb-1.5">
              Categoria
            </span>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              required
              className="w-full bg-background border border-border text-slate-100 rounded-md px-3 py-2.5 outline-none focus:border-accent"
            >
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs uppercase tracking-wide text-muted mb-1.5">
                Valor (R$)
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
                className="w-full bg-background border border-border text-slate-100 rounded-md px-3 py-2.5 outline-none focus:border-accent"
              />
            </label>

            <label className="block">
              <span className="block text-xs uppercase tracking-wide text-muted mb-1.5">Data</span>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                className="w-full bg-background border border-border text-slate-100 rounded-md px-3 py-2.5 outline-none focus:border-accent"
              />
            </label>
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
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-md transition-colors"
            >
              {enviando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
