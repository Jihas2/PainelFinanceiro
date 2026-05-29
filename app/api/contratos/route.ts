import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB

export async function GET() {
  const rows = await sql`
    SELECT
      id,
      nome,
      categoria,
      descricao,
      valor::float8 AS valor,
      to_char(inicio, 'YYYY-MM-DD') AS inicio,
      to_char(fim, 'YYYY-MM-DD') AS fim,
      ativo,
      pdf_nome,
      pdf_tamanho,
      criado_em
    FROM contratos
    ORDER BY ativo DESC, categoria ASC, criado_em DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
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

  if (!nome) {
    return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  }

  let pdfBuffer: Buffer | null = null;
  let pdfNome: string | null = null;
  let pdfTamanho: number | null = null;

  const pdf = form.get("pdf");
  if (pdf instanceof File && pdf.size > 0) {
    if (pdf.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: "PDF maior que 5 MB" }, { status: 400 });
    }
    if (pdf.type && pdf.type !== "application/pdf") {
      return NextResponse.json({ error: "Apenas arquivos PDF são aceitos" }, { status: 400 });
    }
    pdfBuffer = Buffer.from(await pdf.arrayBuffer());
    pdfNome = pdf.name;
    pdfTamanho = pdf.size;
  }

  const [row] = await sql`
    INSERT INTO contratos (nome, categoria, descricao, valor, inicio, fim, ativo, pdf_dados, pdf_nome, pdf_tamanho)
    VALUES (
      ${nome}, ${categoria}, ${descricao}, ${valor}, ${inicio}, ${fim}, ${ativo},
      ${pdfBuffer}, ${pdfNome}, ${pdfTamanho}
    )
    RETURNING
      id, nome, categoria, descricao, valor::float8 AS valor,
      to_char(inicio, 'YYYY-MM-DD') AS inicio,
      to_char(fim, 'YYYY-MM-DD') AS fim,
      ativo, pdf_nome, pdf_tamanho, criado_em
  `;
  return NextResponse.json(row, { status: 201 });
}
