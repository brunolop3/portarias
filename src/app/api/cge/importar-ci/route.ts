// POST /api/cge/importar-ci  (multipart/form-data)
//   campo "file": PDF, imagem ou .docx da CI (Comunicação Interna)
//
// A importação automática via IA (visão computacional) foi desativada: as
// opções viáveis exigiam uma API paga (custo recorrente) ou um modelo local
// (LM Studio) inaceitavelmente lento para esse uso. Este endpoint sempre
// responde pedindo preenchimento manual — o frontend já trata isso como
// fallback normal (a importação nunca bloqueou o preenchimento manual).
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Importação automática de CI desativada. Preencha os campos manualmente.",
    },
    { status: 501 }
  );
}
