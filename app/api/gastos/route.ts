import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get("month");
  const rows = month
    ? await sql`
        SELECT id, descricao, categoria, valor::float8 AS valor, to_char(data, 'YYYY-MM-DD') AS data, criado_em
        FROM gastos
        WHERE to_char(data, 'YYYY-MM') = ${month}
        ORDER BY data DESC, id DESC
      `
    : await sql`
        SELECT id, descricao, categoria, valor::float8 AS valor, to_char(data, 'YYYY-MM-DD') AS data, criado_em
        FROM gastos
        ORDER BY data DESC, id DESC
      `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.descricao !== "string" ||
    typeof body.categoria !== "string" ||
    typeof body.valor !== "number" ||
    typeof body.data !== "string"
  ) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  if (body.valor <= 0) {
    return NextResponse.json({ error: "Valor deve ser positivo" }, { status: 400 });
  }
  const descricao = body.descricao.trim();
  const categoria = body.categoria.trim();
  if (!descricao || !categoria) {
    return NextResponse.json({ error: "Descrição e categoria obrigatórias" }, { status: 400 });
  }
  const [row] = await sql`
    INSERT INTO gastos (descricao, categoria, valor, data)
    VALUES (${descricao}, ${categoria}, ${body.valor}, ${body.data})
    RETURNING id, descricao, categoria, valor::float8 AS valor, to_char(data, 'YYYY-MM-DD') AS data, criado_em
  `;
  return NextResponse.json(row, { status: 201 });
}
