import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const [row] = await sql`
    SELECT pdf_dados, pdf_nome
    FROM contratos
    WHERE id = ${numId}
  `;

  if (!row || !row.pdf_dados) {
    return NextResponse.json({ error: "PDF não encontrado" }, { status: 404 });
  }

  // Neon retorna bytea como Buffer ou hex string
  let bytes: Buffer;
  if (Buffer.isBuffer(row.pdf_dados)) {
    bytes = row.pdf_dados;
  } else if (row.pdf_dados instanceof Uint8Array) {
    bytes = Buffer.from(row.pdf_dados);
  } else if (typeof row.pdf_dados === "string") {
    // formato hex tipo "\\x255044462d..."
    const hex = row.pdf_dados.startsWith("\\x") ? row.pdf_dados.slice(2) : row.pdf_dados;
    bytes = Buffer.from(hex, "hex");
  } else {
    return NextResponse.json({ error: "Formato de PDF inválido" }, { status: 500 });
  }

  const nome = row.pdf_nome || `contrato-${numId}.pdf`;
  const safeNome = encodeURIComponent(nome);

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeNome}"`,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
