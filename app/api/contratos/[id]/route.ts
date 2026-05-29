import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const contentType = req.headers.get("content-type") || "";

  // Toggle simples de ativo via JSON (compat. com chamadas antigas)
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.ativo !== "boolean") {
      return NextResponse.json({ error: "Campo 'ativo' obrigatório" }, { status: 400 });
    }
    const [row] = await sql`
      UPDATE contratos SET ativo = ${body.ativo}
      WHERE id = ${numId}
      RETURNING
        id, nome, categoria, descricao, valor::float8 AS valor,
        to_char(inicio, 'YYYY-MM-DD') AS inicio,
        to_char(fim, 'YYYY-MM-DD') AS fim,
        ativo, pdf_nome, pdf_tamanho, criado_em
    `;
    if (!row) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json(row);
  }

  // Edição completa via FormData
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Use multipart/form-data" }, { status: 400 });
  }

  const nome = String(form.get("nome") || "").trim();
  const categoria = String(form.get("categoria") || "Geral").trim() || "Geral";
  const descricao = String(form.get("descricao") || "").trim() || null;
  const valor = parseFloat(String(form.get("valor") || "0")) || 0;
  const inicio = String(form.get("inicio") || "") || null;
  const fim = String(form.get("fim") || "") || null;
  const ativo = String(form.get("ativo") || "true") === "true";
  const removerPdf = String(form.get("removerPdf") || "false") === "true";

  if (!nome) {
    return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  }

  const pdf = form.get("pdf");
  const temNovoPdf = pdf instanceof File && pdf.size > 0;

  let pdfBuffer: Buffer | null = null;
  let pdfNome: string | null = null;
  let pdfTamanho: number | null = null;

  if (temNovoPdf) {
    const file = pdf as File;
    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: "PDF maior que 5 MB" }, { status: 400 });
    }
    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json({ error: "Apenas arquivos PDF são aceitos" }, { status: 400 });
    }
    pdfBuffer = Buffer.from(await file.arrayBuffer());
    pdfNome = file.name;
    pdfTamanho = file.size;
  }

  let row;
  if (temNovoPdf) {
    [row] = await sql`
      UPDATE contratos SET
        nome = ${nome},
        categoria = ${categoria},
        descricao = ${descricao},
        valor = ${valor},
        inicio = ${inicio},
        fim = ${fim},
        ativo = ${ativo},
        pdf_dados = ${pdfBuffer},
        pdf_nome = ${pdfNome},
        pdf_tamanho = ${pdfTamanho}
      WHERE id = ${numId}
      RETURNING
        id, nome, categoria, descricao, valor::float8 AS valor,
        to_char(inicio, 'YYYY-MM-DD') AS inicio,
        to_char(fim, 'YYYY-MM-DD') AS fim,
        ativo, pdf_nome, pdf_tamanho, criado_em
    `;
  } else if (removerPdf) {
    [row] = await sql`
      UPDATE contratos SET
        nome = ${nome},
        categoria = ${categoria},
        descricao = ${descricao},
        valor = ${valor},
        inicio = ${inicio},
        fim = ${fim},
        ativo = ${ativo},
        pdf_dados = NULL,
        pdf_nome = NULL,
        pdf_tamanho = NULL
      WHERE id = ${numId}
      RETURNING
        id, nome, categoria, descricao, valor::float8 AS valor,
        to_char(inicio, 'YYYY-MM-DD') AS inicio,
        to_char(fim, 'YYYY-MM-DD') AS fim,
        ativo, pdf_nome, pdf_tamanho, criado_em
    `;
  } else {
    [row] = await sql`
      UPDATE contratos SET
        nome = ${nome},
        categoria = ${categoria},
        descricao = ${descricao},
        valor = ${valor},
        inicio = ${inicio},
        fim = ${fim},
        ativo = ${ativo}
      WHERE id = ${numId}
      RETURNING
        id, nome, categoria, descricao, valor::float8 AS valor,
        to_char(inicio, 'YYYY-MM-DD') AS inicio,
        to_char(fim, 'YYYY-MM-DD') AS fim,
        ativo, pdf_nome, pdf_tamanho, criado_em
    `;
  }

  if (!row) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  await sql`DELETE FROM contratos WHERE id = ${numId}`;
  return NextResponse.json({ ok: true });
}
