import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.descricao !== "string" ||
    typeof body.valor !== "number" ||
    typeof body.data !== "string"
  ) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  if (body.valor <= 0) {
    return NextResponse.json({ error: "Valor deve ser positivo" }, { status: 400 });
  }
  const descricao = body.descricao.trim();
  if (!descricao) {
    return NextResponse.json({ error: "Descrição obrigatória" }, { status: 400 });
  }
  const [row] = await sql`
    UPDATE receitas
    SET descricao = ${descricao}, valor = ${body.valor}, data = ${body.data}
    WHERE id = ${numId}
    RETURNING id, descricao, valor::float8 AS valor, to_char(data, 'YYYY-MM-DD') AS data, criado_em
  `;
  if (!row) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  await sql`DELETE FROM receitas WHERE id = ${numId}`;
  return NextResponse.json({ ok: true });
}
