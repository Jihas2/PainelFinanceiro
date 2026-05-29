import Shell from "@/components/Shell";
import FinancasView from "@/components/FinancasView";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Shell title="Finanças" subtitle="Controle suas receitas e gastos do dia a dia">
      <FinancasView />
    </Shell>
  );
}
