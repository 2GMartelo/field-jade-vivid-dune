/**
 * Reads the Stable Diffusion "PNG Info" a lot of generators (A1111,
 * Forge, InvokeAI, ...) embed as a `tEXt`/`iTXt` chunk named "parameters" —
 * the same thing that tool's own "PNG Info" tab shows. ComfyUI instead
 * embeds a full node graph as JSON ("prompt"/"workflow" chunks); that's not
 * a single prompt string to extract, so it's surfaced as raw JSON rather
 * than parsed.
 */
export type GenerationInfo = {
  prompt?: string;
  negativePrompt?: string;
  params: Record<string, string>;
  raw: string;
  comfyWorkflow?: boolean;
};

function readTextChunks(bytes: Uint8Array): Record<string, string> {
  const out: Record<string, string> = {};
  if (bytes.length < 8) return out;
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) if (bytes[i] !== sig[i]) return out;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  const decoder = new TextDecoder("utf-8");
  const latin1 = new TextDecoder("latin1");
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = latin1.decode(bytes.subarray(offset + 4, offset + 8));
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd > bytes.length) break;
    if (type === "tEXt") {
      const chunk = bytes.subarray(dataStart, dataEnd);
      const nullIdx = chunk.indexOf(0);
      if (nullIdx > 0) {
        const key = latin1.decode(chunk.subarray(0, nullIdx));
        out[key] = latin1.decode(chunk.subarray(nullIdx + 1));
      }
    } else if (type === "iTXt") {
      const chunk = bytes.subarray(dataStart, dataEnd);
      const nullIdx = chunk.indexOf(0);
      if (nullIdx > 0) {
        const key = latin1.decode(chunk.subarray(0, nullIdx));
        // keyword\0 compressionFlag compressionMethod langTag\0 translatedKeyword\0 text
        let p = nullIdx + 1;
        const compressed = chunk[p] === 1;
        p += 2; // flag + method
        const langEnd = chunk.indexOf(0, p);
        p = langEnd + 1;
        const trKeyEnd = chunk.indexOf(0, p);
        p = trKeyEnd + 1;
        if (!compressed) out[key] = decoder.decode(chunk.subarray(p));
      }
    } else if (type === "IDAT" || type === "IEND") {
      break; // metadata always comes before the image data
    }
    offset = dataEnd + 4; // skip CRC
  }
  return out;
}

/**
 * Splits "Key: value, Key: value" on the commas that actually separate
 * params — not ones inside a quoted value (A1111's own "Lora hashes: "a: 1,
 * b: 2"" convention) or a plain unquoted list value with no colon of its own.
 */
function splitParamPieces(tail: string): string[] {
  const pieces: string[] = [];
  let start = 0;
  let inQuotes = false;
  for (let i = 0; i < tail.length; i++) {
    const ch = tail[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) {
      const boundary = /^\s*[A-Za-z][\w ]*:\s/.exec(tail.slice(i + 1));
      if (boundary) {
        pieces.push(tail.slice(start, i));
        start = i + 1;
      }
    }
  }
  pieces.push(tail.slice(start));
  return pieces;
}

/** Splits A1111-style "prompt\nNegative prompt: ...\nSteps: 20, Sampler: ..., Seed: ..." into parts. */
function parseA1111(text: string): GenerationInfo {
  const negIdx = text.indexOf("\nNegative prompt:");
  let prompt = text;
  let negativePrompt: string | undefined;
  let tail = "";
  if (negIdx >= 0) {
    prompt = text.slice(0, negIdx).trim();
    const rest = text.slice(negIdx + 1);
    const lineEnd = rest.indexOf("\n");
    if (lineEnd >= 0) {
      negativePrompt = rest.slice("Negative prompt:".length, lineEnd).trim();
      tail = rest.slice(lineEnd + 1);
    } else {
      negativePrompt = rest.slice("Negative prompt:".length).trim();
    }
  } else {
    const lastLine = text.lastIndexOf("\nSteps:");
    if (lastLine >= 0) {
      prompt = text.slice(0, lastLine).trim();
      tail = text.slice(lastLine + 1);
    }
  }
  const params: Record<string, string> = {};
  if (tail.trim()) {
    const pieces = splitParamPieces(tail.trim());
    for (const piece of pieces) {
      const idx = piece.indexOf(":");
      if (idx <= 0) continue;
      const value = piece.slice(idx + 1).trim();
      const unquoted = value.length >= 2 && value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
      params[piece.slice(0, idx).trim()] = unquoted;
    }
  }
  return { prompt: prompt || undefined, negativePrompt, params, raw: text };
}

export function parsePngGenerationInfo(bytes: Uint8Array): GenerationInfo | null {
  const chunks = readTextChunks(bytes);
  const parameters = chunks.parameters;
  if (parameters) return parseA1111(parameters);
  if (chunks.prompt || chunks.workflow) {
    return {
      params: {},
      raw: chunks.prompt || chunks.workflow || "",
      comfyWorkflow: true,
    };
  }
  return null;
}
