import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("ERRO: DATABASE_URL não definida em .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

console.log("Criando tabela receitas...");
await sql`
  CREATE TABLE IF NOT EXISTS receitas (
    id SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
    data DATE NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

console.log("Criando tabela gastos...");
await sql`
  CREATE TABLE IF NOT EXISTS gastos (
    id SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL,
    valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
    data DATE NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

console.log("Criando tabela contratos...");
await sql`
  CREATE TABLE IF NOT EXISTS contratos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    valor NUMERIC(12,2) DEFAULT 0,
    inicio DATE,
    fim DATE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

console.log("Criando índices...");
await sql`CREATE INDEX IF NOT EXISTS receitas_data_idx ON receitas(data DESC)`;
await sql`CREATE INDEX IF NOT EXISTS gastos_data_idx ON gastos(data DESC)`;
await sql`CREATE INDEX IF NOT EXISTS contratos_ativo_idx ON contratos(ativo)`;

console.log("\nBanco inicializado com sucesso!");
