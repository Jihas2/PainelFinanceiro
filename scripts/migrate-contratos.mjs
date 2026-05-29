import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("ERRO: DATABASE_URL não definida em .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

console.log("Adicionando coluna 'categoria'...");
await sql`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'Geral'`;

console.log("Adicionando coluna 'pdf_dados'...");
await sql`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS pdf_dados BYTEA`;

console.log("Adicionando coluna 'pdf_nome'...");
await sql`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS pdf_nome TEXT`;

console.log("Adicionando coluna 'pdf_tamanho'...");
await sql`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS pdf_tamanho INTEGER`;

console.log("Criando índice por categoria...");
await sql`CREATE INDEX IF NOT EXISTS contratos_categoria_idx ON contratos(categoria)`;

console.log("\nMigração concluída com sucesso!");
