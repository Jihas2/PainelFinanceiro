import Shell from "@/components/Shell";
import ContratosView from "@/components/ContratosView";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Shell title="Contratos" subtitle="Gerencie seus contratos ativos e inativos">
      <ContratosView />
    </Shell>
  );
}
