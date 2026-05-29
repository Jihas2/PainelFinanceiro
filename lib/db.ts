import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida. Crie um arquivo .env.local baseado em .env.local.example.");
}

export const sql = neon(process.env.DATABASE_URL);

export type Receita = {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  criado_em: string;
};

export type Gasto = {
  id: number;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  criado_em: string;
};

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
  criado_em: string;
};
