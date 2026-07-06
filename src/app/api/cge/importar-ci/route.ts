// POST /api/cge/importar-ci  (multipart/form-data)
//   campo "file": PDF, imagem ou .docx da CI (Comunicação Interna)
//
// Estratégia: usa um modelo de visão via servidor OpenAI-compatible. Duas
// opções, escolhidas em runtime:
//   - OpenRouter (nuvem, precisa de OPENROUTER_API_KEY) — funciona em
//     qualquer hospedagem, inclusive Vercel.
//   - LM Studio (local, LMSTUDIO_BASE_URL) — grátis e ilimitado, mas só
//     funciona enquanto o LM Studio estiver aberto na máquina que roda a app.
// Se OPENROUTER_API_KEY estiver definida, ela tem prioridade; senão cai para
// o LM Studio local.
//
// PDFs são rasterizados em imagens (pdf-to-img) antes do envio, já que
// modelos de visão não leem PDF nativamente neste formato de API. .docx tem
// o texto extraído com "mammoth" e é enviado como texto simples.
//
// O resultado é sempre uma SUGESTÃO — o frontend mostra os campos destacados
// como "importado da CI" e o usuário deve confirmar/corrigir antes de gerar
// a minuta. A importação nunca bloqueia o preenchimento manual.
import { NextRequest, NextResponse } from "next/server";
import type { ExtracaoCI } from "@/lib/cge/types";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_PDF_PAGES = 5; // CIs costumam ter 1 página; limite evita prompts gigantes
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemma-4-26b-a4b-it:free";
const LMSTUDIO_BASE_URL = process.env.LMSTUDIO_BASE_URL || "http://localhost:1234/v1";
const LMSTUDIO_MODEL = process.env.LMSTUDIO_MODEL || "local-model";

// Mapeia extensão para o MIME type quando o navegador não o informa.
function mimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) return DOCX_MIME;
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".bmp")) return "image/bmp";
  if (lower.endsWith(".txt")) return "text/plain";
  return "application/octet-stream";
}

const PROMPT_EXTRACAO = `Você é um assistente que lê documentos institucionais da UEMS (Universidade Estadual de Mato Grosso do Sul).
O documento anexado é uma CI (Comunicação Interna) enviada pela Coordenação de um Curso, informando os membros do Comitê de Gestão do Enade (CGE) eleitos pelo colegiado.

Extraia do documento, com a maior precisão possível, os seguintes dados:
1. O número da CI (ex.: "CI n.º 123/2026" ou "CI 123/2026" -> retornar "123/2026").
2. O nome do curso mencionado (se houver).
3. O nome da Unidade Universitária mencionada (se houver).
4. A lista de membros eleitos, cada um com:
   - nome completo (em MAIÚSCULAS se vier assim; mantenha como está)
   - função, que DEVE ser uma destas três opções literais:
       "Presidente"
       "Coordenador(a) do Curso - Membro Nato"
       "Membro"

Regras:
- Se a CI mencionar "presidente", use a função "Presidente".
- Se mencionar "coordenador(a) do curso" (ou só "coordenador"), use "Coordenador(a) do Curso - Membro Nato".
- Para os demais membros, use "Membro".
- Se um campo não estiver presente no documento, retorne null para ele (ou string vazia).
- Não invente dados. Se não houver membros identificáveis, retorne lista vazia.

Responda SOMENTE com um objeto JSON válido, sem texto adicional, no formato:
{
  "ciNumero": "string ou null",
  "curso": "string ou null",
  "unidadeUniversitaria": "string ou null",
  "membros": [
    { "nome": "string", "funcao": "Presidente | Coordenador(a) do Curso - Membro Nato | Membro" }
  ],
  "avisos": ["string - observações sobre dificuldades de leitura, se houver"]
}`;

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Arquivo maior que 10 MB." },
        { status: 413 }
      );
    }

    const mime = file.type || mimeFromName(file.name);
    const buf = Buffer.from(await file.arrayBuffer());

    const contentParts: ContentPart[] = [{ type: "text", text: PROMPT_EXTRACAO }];

    if (mime === DOCX_MIME) {
      const mammoth = await import("mammoth");
      const { value: texto } = await mammoth.extractRawText({ buffer: buf });
      contentParts.push({
        type: "text",
        text: `\n\n--- CONTEÚDO DO DOCUMENTO ---\n${texto}`,
      });
    } else if (mime === "application/pdf") {
      const { pdf } = await import("pdf-to-img");
      const doc = await pdf(`data:application/pdf;base64,${buf.toString("base64")}`, {
        scale: 2,
      });
      let pageCount = 0;
      for await (const pageBuf of doc) {
        if (pageCount >= MAX_PDF_PAGES) break;
        contentParts.push({
          type: "image_url",
          image_url: { url: `data:image/png;base64,${pageBuf.toString("base64")}` },
        });
        pageCount++;
      }
    } else if (mime.startsWith("image/")) {
      contentParts.push({
        type: "image_url",
        image_url: { url: `data:${mime};base64,${buf.toString("base64")}` },
      });
    } else {
      // .txt e formatos não reconhecidos: tenta ler como texto puro.
      contentParts.push({
        type: "text",
        text: `\n\n--- CONTEÚDO DO DOCUMENTO ---\n${buf.toString("utf-8")}`,
      });
    }

    const baseUrl = OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : LMSTUDIO_BASE_URL;
    const model = OPENROUTER_API_KEY ? OPENROUTER_MODEL : LMSTUDIO_MODEL;
    const providerNome = OPENROUTER_API_KEY ? "OpenRouter" : "LM Studio";

    const visionResp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(OPENROUTER_API_KEY ? { Authorization: `Bearer ${OPENROUTER_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: contentParts }],
        temperature: 0,
      }),
    });

    if (!visionResp.ok) {
      const errText = await visionResp.text();
      throw new Error(`${providerNome} retornou ${visionResp.status}: ${errText}`);
    }

    const visionData = await visionResp.json();
    const content: string = visionData.choices?.[0]?.message?.content ?? "";

    // O modelo pode devolver o JSON dentro de ```json ... ```. Limpa.
    let jsonStr = content.trim();
    const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) jsonStr = fence[1].trim();
    // Tenta casar o primeiro { ... } equilibrado.
    const start = jsonStr.indexOf("{");
    const end = jsonStr.lastIndexOf("}");
    if (start >= 0 && end > start) {
      jsonStr = jsonStr.slice(start, end + 1);
    }

    let parsed: Partial<ExtracaoCI> = {};
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Se não veio JSON válido, retorna como aviso + texto bruto.
      return NextResponse.json({
        ciNumero: undefined,
        curso: undefined,
        unidadeUniversitaria: undefined,
        membros: [],
        textoExtraido: content,
        avisos: [
          "Não foi possível interpretar a resposta do modelo como JSON. " +
            "Revise manualmente os campos. Texto bruto retornado em textoExtraido.",
        ],
      } satisfies ExtracaoCI);
    }

    // Normaliza funções para os três valores literais aceitos.
    const funcoesValidas = new Set([
      "Presidente",
      "Coordenador(a) do Curso - Membro Nato",
      "Membro",
    ]);
    const membros = (parsed.membros ?? []).map((m) => {
      let f = (m.funcao || "").trim();
      if (!funcoesValidas.has(f)) {
        const fl = f.toLowerCase();
        if (fl.includes("presidente")) f = "Presidente";
        else if (fl.includes("coordenador")) f = "Coordenador(a) do Curso - Membro Nato";
        else f = "Membro";
      }
      return { nome: (m.nome || "").trim(), funcao: f };
    });

    const resultado: ExtracaoCI = {
      ciNumero: parsed.ciNumero || undefined,
      curso: parsed.curso || undefined,
      unidadeUniversitaria: parsed.unidadeUniversitaria || undefined,
      membros,
      avisos: parsed.avisos,
    };

    return NextResponse.json(resultado);
  } catch (e) {
    return NextResponse.json(
      {
        error:
          "Falha ao processar a CI: " +
          (e as Error).message +
          ". Você pode preencher os campos manualmente.",
      },
      { status: 500 }
    );
  }
}
