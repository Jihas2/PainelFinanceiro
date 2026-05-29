"use client";

import { useEffect, useMemo, useState } from "react";
import { formatarReal, formatarData, hojeISO, mesAtualISO, formatarMes, navegarMes } from "@/lib/format";
import EditarReceitaModal from "./EditarReceitaModal";
import EditarGastoModal from "./EditarGastoModal";

export type Receita = { id: number; descricao: string; valor: number; data: string };
export type Gasto = {
  id: number;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
};

const CATEGORIAS = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Lazer",
  "Saúde",
  "Educação",
  "Contas",
  "Outros",
];

export default function FinancasView() {
  const [mes, setMes] = useState(mesAtualISO());
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [editandoReceita, setEditandoReceita] = useState<Receita | null>(null);
  const [editandoGasto, setEditandoGasto] = useState<Gasto | null>(null);

  // form receita
  const [rDesc, setRDesc] = useState("");
  const [rValor, setRValor] = useState("");
  const [rData, setRData] = useState(hojeISO());
  const [rEnv, setREnv] = useState(false);

  // form gasto
  const [gDesc, setGDesc] = useState("");
  const [gCat, setGCat] = useState("");
  const [gValor, setGValor] = useState("");
  const [gData, setGData] = useState(hojeISO());
  const [gEnv, setGEnv] = useState(false);

  useEffect(() => {
    setCarregando(true);
    Promise.all([
      fetch(`/api/receitas?month=${mes}`).then((r) => r.json()),
      fetch(`/api/gastos?month=${mes}`).then((r) => r.json()),
    ])
      .then(([r, g]) => {
        setReceitas(r);
        setGastos(g);
      })
      .finally(() => setCarregando(false));
  }, [mes]);

  const totalReceita = useMemo(() => receitas.reduce((s, r) => s + r.valor, 0), [receitas]);
  const totalGastos = useMemo(() => gastos.reduce((s, g) => s + g.valor, 0), [gastos]);
  const saldo = totalReceita - totalGastos;

  const mesAtual = mesAtualISO();
  const ehMesAtual = mes === mesAtual;

  function dataPadrao(): string {
    // Se o mês selecionado é o atual, usa hoje. Senão usa o dia 1 do mês selecionado.
    return ehMesAtual ? hojeISO() : `${mes}-01`;
  }

  async function addReceita(e: React.FormEvent) {
    e.preventDefault();
    setREnv(true);
    const res = await fetch("/api/receitas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao: rDesc, valor: parseFloat(rValor), data: rData }),
    });
    setREnv(false);
    if (res.ok) {
      const nova: Receita = await res.json();
      // só mostra na lista atual se a data cai no mês selecionado
      if (nova.data.startsWith(mes)) {
        setReceitas((prev) => [nova, ...prev]);
      }
      setRDesc("");
      setRValor("");
      setRData(dataPadrao());
    }
  }

  async function addGasto(e: React.FormEvent) {
    e.preventDefault();
    setGEnv(true);
    const res = await fetch("/api/gastos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao: gDesc,
        categoria: gCat,
        valor: parseFloat(gValor),
        data: gData,
      }),
    });
    setGEnv(false);
    if (res.ok) {
      const novo: Gasto = await res.json();
      if (novo.data.startsWith(mes)) {
        setGastos((prev) => [novo, ...prev]);
      }
      setGDesc("");
      setGCat("");
      setGValor("");
      setGData(dataPadrao());
    }
  }

  async function removeReceita(id: number) {
    if (!confirm("Remover esta receita?")) return;
    const res = await fetch(`/api/receitas/${id}`, { method: "DELETE" });
    if (res.ok) setReceitas((prev) => prev.filter((r) => r.id !== id));
  }

  async function removeGasto(id: number) {
    if (!confirm("Remover este gasto?")) return;
    const res = await fetch(`/api/gastos/${id}`, { method: "DELETE" });
    if (res.ok) setGastos((prev) => prev.filter((g) => g.id !== id));
  }

  function aoSalvarReceita(atualizada: Receita) {
    if (atualizada.data.startsWith(mes)) {
      setReceitas((prev) => prev.map((r) => (r.id === atualizada.id ? atualizada : r)));
    } else {
      // moveu pra outro mês — some da lista atual
      setReceitas((prev) => prev.filter((r) => r.id !== atualizada.id));
    }
    setEditandoReceita(null);
  }

  function aoSalvarGasto(atualizado: Gasto) {
    if (atualizado.data.startsWith(mes)) {
      setGastos((prev) => prev.map((g) => (g.id === atualizado.id ? atualizado : g)));
    } else {
      setGastos((prev) => prev.filter((g) => g.id !== atualizado.id));
    }
    setEditandoGasto(null);
  }

  return (
    <div className="space-y-6">
      {/* Seletor de mês */}
      <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-5 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMes(navegarMes(mes, -1))}
            className="w-9 h-9 rounded-md bg-background hover:bg-surfaceAlt border border-border text-slate-300 transition-colors flex items-center justify-center"
            aria-label="Mês anterior"
          >
            ←
          </button>
          <span className="px-4 text-base font-semibold text-slate-100 min-w-[170px] text-center">
            {formatarMes(mes)}
          </span>
          <button
            onClick={() => setMes(navegarMes(mes, 1))}
            className="w-9 h-9 rounded-md bg-background hover:bg-surfaceAlt border border-border text-slate-300 transition-colors flex items-center justify-center"
            aria-label="Próximo mês"
          >
            →
          </button>
        </div>
        {!ehMesAtual && (
          <button
            onClick={() => setMes(mesAtual)}
            className="text-xs px-3 py-1.5 rounded-md bg-accent/15 text-blue-300 border border-accent/30 hover:bg-accent/25 transition-colors"
          >
            Voltar ao mês atual
          </button>
        )}
        {ehMesAtual && <span className="text-xs text-muted">Mês atual</span>}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResumoCard label="Receitas do mês" value={formatarReal(totalReceita)} accent="green" />
        <ResumoCard label="Gastos do mês" value={formatarReal(totalGastos)} accent="red" />
        <ResumoCard
          label="Saldo do mês"
          value={formatarReal(saldo)}
          accent={saldo < 0 ? "red" : "blue"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receitas */}
        <section className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-100 mb-4">Nova receita</h3>
          <form onSubmit={addReceita} className="space-y-3">
            <Campo label="Descrição">
              <input
                type="text"
                value={rDesc}
                onChange={(e) => setRDesc(e.target.value)}
                placeholder="Ex: Salário, Freelance..."
                required
                className="input"
              />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Valor (R$)">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={rValor}
                  onChange={(e) => setRValor(e.target.value)}
                  placeholder="0,00"
                  required
                  className="input"
                />
              </Campo>
              <Campo label="Data">
                <input
                  type="date"
                  value={rData}
                  onChange={(e) => setRData(e.target.value)}
                  required
                  className="input"
                />
              </Campo>
            </div>
            <button
              type="submit"
              disabled={rEnv}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-md transition-colors"
            >
              {rEnv ? "Salvando..." : "Adicionar Receita"}
            </button>
          </form>

          <h4 className="text-sm font-semibold text-slate-300 mt-6 mb-3 pb-2 border-b border-border">
            Receitas de {formatarMes(mes)}
          </h4>
          <Lista
            vazio={carregando ? "Carregando..." : "Nenhuma receita neste mês"}
            items={receitas.map((r) => ({
              id: r.id,
              titulo: r.descricao,
              sub: formatarData(r.data),
              valor: `+ ${formatarReal(r.valor)}`,
              cor: "text-emerald-400",
              onEdit: () => setEditandoReceita(r),
              onRemove: () => removeReceita(r.id),
            }))}
          />
        </section>

        {/* Gastos */}
        <section className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-100 mb-4">Novo gasto</h3>
          <form onSubmit={addGasto} className="space-y-3">
            <Campo label="Descrição">
              <input
                type="text"
                value={gDesc}
                onChange={(e) => setGDesc(e.target.value)}
                placeholder="Ex: Mercado, Aluguel..."
                required
                className="input"
              />
            </Campo>
            <Campo label="Categoria">
              <select
                value={gCat}
                onChange={(e) => setGCat(e.target.value)}
                required
                className="input"
              >
                <option value="">Selecione</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Valor (R$)">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={gValor}
                  onChange={(e) => setGValor(e.target.value)}
                  placeholder="0,00"
                  required
                  className="input"
                />
              </Campo>
              <Campo label="Data">
                <input
                  type="date"
                  value={gData}
                  onChange={(e) => setGData(e.target.value)}
                  required
                  className="input"
                />
              </Campo>
            </div>
            <button
              type="submit"
              disabled={gEnv}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-md transition-colors"
            >
              {gEnv ? "Salvando..." : "Adicionar Gasto"}
            </button>
          </form>

          <h4 className="text-sm font-semibold text-slate-300 mt-6 mb-3 pb-2 border-b border-border">
            Gastos de {formatarMes(mes)}
          </h4>
          <Lista
            vazio={carregando ? "Carregando..." : "Nenhum gasto neste mês"}
            items={gastos.map((g) => ({
              id: g.id,
              titulo: g.descricao,
              sub: `${g.categoria} • ${formatarData(g.data)}`,
              valor: `- ${formatarReal(g.valor)}`,
              cor: "text-red-400",
              onEdit: () => setEditandoGasto(g),
              onRemove: () => removeGasto(g.id),
            }))}
          />
        </section>
      </div>

      {editandoReceita && (
        <EditarReceitaModal
          receita={editandoReceita}
          onClose={() => setEditandoReceita(null)}
          onSalvar={aoSalvarReceita}
        />
      )}
      {editandoGasto && (
        <EditarGastoModal
          gasto={editandoGasto}
          categorias={CATEGORIAS}
          onClose={() => setEditandoGasto(null)}
          onSalvar={aoSalvarGasto}
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

function ResumoCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "green" | "red" | "blue";
}) {
  const borderMap = {
    green: "border-l-emerald-500",
    red: "border-l-red-500",
    blue: "border-l-blue-500",
  };
  const textMap = {
    green: "text-emerald-400",
    red: "text-red-400",
    blue: "text-blue-400",
  };
  return (
    <div
      className={`bg-surface border border-border border-l-4 ${borderMap[accent]} rounded-xl p-5`}
    >
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${textMap[accent]}`}>{value}</p>
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

type Item = {
  id: number;
  titulo: string;
  sub: string;
  valor: string;
  cor: string;
  onEdit: () => void;
  onRemove: () => void;
};

function Lista({ items, vazio }: { items: Item[]; vazio: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted italic text-center py-6">{vazio}</p>;
  }
  return (
    <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2.5"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-100 truncate">{item.titulo}</p>
            <p className="text-xs text-muted">{item.sub}</p>
          </div>
          <span className={`text-sm font-semibold whitespace-nowrap ${item.cor}`}>{item.valor}</span>
          <button
            onClick={item.onEdit}
            className="text-xs text-muted hover:text-blue-400 hover:border-blue-500 border border-border rounded px-2 py-1 transition-colors"
            title="Editar"
          >
            Editar
          </button>
          <button
            onClick={item.onRemove}
            className="text-xs text-muted hover:text-red-400 hover:border-red-500 border border-border rounded px-2 py-1 transition-colors"
            title="Remover"
          >
            Remover
          </button>
        </li>
      ))}
    </ul>
  );
}
