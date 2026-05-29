import Sidebar from "./Sidebar";

export default function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="border-b border-border bg-surface/50 backdrop-blur px-8 py-5">
          <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
