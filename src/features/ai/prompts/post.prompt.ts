import type {
  GeneratePostInput,
} from "../types/ai.ts";

export const POST_SYSTEM_PROMPT = `Eres especialista en contenido para pequeños negocios gastronómicos de Chile.

Escribe un único texto sugerido para una publicación. Debe ser cercano, honesto, local y fácil de editar.

Identidad de Hostal Monchito:
- Restaurante familiar en Puerto Cisnes.
- Atiende a residentes, turistas y trabajadores temporales.
- El menú diario y las pizzas tienen la misma importancia.
- Las pizzas son artesanales, tienen delivery y no cuentan con competencia directa local.
- Ofrece comida chilena, pan amasado hecho en el local, porciones generosas y pastas frescas.
- Las fotografías y videos son siempre reales.

Reglas:
- No inventes platos, precios, promociones, horarios, direcciones ni servicios.
- No exageres ni uses afirmaciones falsas.
- Evita hashtags genéricos excesivos.
- Incluye una llamada a la acción o la ubicación cuando aporte valor.
- Empieza con un saludo natural relacionado con el día de la semana.
- En todas las publicaciones de menú diario debes indicar que incluye jugo y pan amasado hecho en el local.
- Cuando reescribas, conserva todos los datos reales, cambia la redacción y no agregues información nueva.
- Cuando agregues hashtags, conserva el texto original y coloca las etiquetas solamente al final.
- Cuando agregues emojis, conserva el texto original y usa pocos símbolos relacionados con el momento, el menú, el clima y la llamada a la acción.
- Ajusta el tono solicitado: formal es respetuoso y cordial; casual es cercano y cotidiano; promocional es persuasivo sin inventar ofertas ni urgencias.
- Si recibes una fotografía, usa solamente detalles visuales que puedas reconocer con seguridad. Los datos escritos del menú son la fuente principal y nunca deben contradecirse.
- Devuelve únicamente el texto de la publicación, sin títulos ni explicaciones.`;

export const REQUIRED_MENU_INCLUSION =
  "El menú diario incluye jugo y pan amasado hecho en el local.";

export const SHORT_POST_MAX_CHARACTERS = 500;

function toHashtag(value: string) {
  const words = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .match(/[A-Za-z0-9]+/g) || [];
  const label = words
    .map(
      (word) =>
        `${word.charAt(0).toUpperCase()}${word.slice(1)}`
    )
    .join("")
    .slice(0, 40);

  return label ? `#${label}` : null;
}

export function appendRelevantHashtags(
  sourceText: string,
  input: GeneratePostInput
) {
  const withoutHashtags = sourceText
    .replace(/#[\p{L}\p{N}_]+/gu, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const hashtags = Array.from(
    new Set(
      [
        toHashtag(input.workspace.name),
        toHashtag(input.workspace.city),
        "#MenuDelDia",
        "#comidacasera",
        "#patagonia",
      ].filter((value): value is string => Boolean(value))
    )
  ).slice(0, 5);

  return `${withoutHashtags}\n\n${hashtags.join(" ")}`;
}

const SMART_EMOJIS = [
  "☀️",
  "🌤️",
  "🌙",
  "🌧️",
  "🔥",
  "🍽️",
  "📍",
  "🛵",
] as const;

function removeSmartEmojis(line: string) {
  return SMART_EMOJIS.reduce(
    (result, emoji) =>
      result.replaceAll(emoji, ""),
    line
  ).trimStart();
}

function prefixMatchingLine(
  lines: string[],
  pattern: RegExp,
  emoji: string,
  excludedIndex = -1
) {
  const index = lines.findIndex(
    (line, lineIndex) =>
      lineIndex !== excludedIndex &&
      !line.trimStart().startsWith("#") &&
      pattern.test(line)
  );

  if (index >= 0) {
    lines[index] = `${emoji} ${lines[index].trimStart()}`;
  }
}

export function addSmartEmojis(
  sourceText: string,
  input: GeneratePostInput
) {
  const lines = sourceText
    .split("\n")
    .map(removeSmartEmojis);
  const firstTextLine = lines.findIndex(
    (line) =>
      Boolean(line.trim()) &&
      !line.trimStart().startsWith("#")
  );
  const timeEmoji =
    input.context?.timeOfDay === "mañana"
      ? "☀️"
      : input.context?.timeOfDay === "noche"
        ? "🌙"
        : "🌤️";

  if (firstTextLine >= 0) {
    lines[firstTextLine] =
      `${timeEmoji} ${lines[firstTextLine].trimStart()}`;
  }

  prefixMatchingLine(
    lines,
    /menú|menu|entrada|plato principal|almuerzo/i,
    "🍽️",
    firstTextLine
  );

  if (input.context?.isRaining) {
    prefixMatchingLine(
      lines,
      /lluv|clima|tiempo|hoy tenemos/i,
      "🌧️",
      firstTextLine
    );
  } else if (input.context?.isCold) {
    prefixMatchingLine(
      lines,
      /fr[ií]o|clima|caliente|hoy tenemos/i,
      "🔥",
      firstTextLine
    );
  }

  prefixMatchingLine(
    lines,
    /te esperamos|estamos en|ubicaci[oó]n/i,
    "📍",
    firstTextLine
  );
  prefixMatchingLine(
    lines,
    /delivery|despacho/i,
    "🛵",
    firstTextLine
  );

  return lines.join("\n").trim();
}

export function ensureRequiredMenuInclusion(
  text: string
) {
  const normalized = text.toLocaleLowerCase("es-CL");

  if (
    normalized.includes("jugo") &&
    normalized.includes("pan amasado")
  ) {
    return text;
  }

  return `${text.trim()}\n\n${REQUIRED_MENU_INCLUSION}`;
}

export function formatPostText(
  text: string,
  input: GeneratePostInput
) {
  if (input.action === "hashtags") {
    return appendRelevantHashtags(
      input.sourceText || text,
      input
    );
  }

  if (input.action === "emojis") {
    return addSmartEmojis(
      input.sourceText || text,
      input
    );
  }

  const withInclusion =
    ensureRequiredMenuInclusion(text);

  if (
    input.length !== "short" ||
    withInclusion.length <=
      SHORT_POST_MAX_CHARACTERS
  ) {
    return withInclusion;
  }

  const available =
    SHORT_POST_MAX_CHARACTERS -
    REQUIRED_MENU_INCLUSION.length -
    4;
  const body = withInclusion
    .replace(REQUIRED_MENU_INCLUSION, "")
    .trim();
  const sliced = body.slice(0, available);
  const lastSpace = sliced.lastIndexOf(" ");
  const compact = sliced
    .slice(0, lastSpace > 0 ? lastSpace : available)
    .trimEnd();

  return `${compact}...\n\n${REQUIRED_MENU_INCLUSION}`;
}

export function buildPostPrompt(
  input: GeneratePostInput
) {
  const action = input.action || "generate";
  const length = input.length || "standard";
  const request = action === "rewrite"
    ? [
        "Reescribe la publicación usando los datos reales indicados.",
        "Debe sentirse como una versión nueva, no como una corrección mínima.",
        "Publicación original:",
        input.sourceText || "",
        "",
        "Datos que debes conservar:",
      ]
    : action === "hashtags"
      ? [
          "Conserva la publicación original sin cambiar su redacción.",
          "Agrega cinco hashtags relevantes solamente al final.",
          "Publicación original:",
          input.sourceText || "",
          "",
          "Datos para elegir los hashtags:",
        ]
      : action === "emojis"
        ? [
            "Conserva la publicación original sin cambiar su redacción.",
            "Agrega emojis contextuales sin saturar el texto.",
            "Publicación original:",
            input.sourceText || "",
            "",
            "Datos para elegir los emojis:",
          ]
    : [
        "Genera la publicación usando estos datos:",
      ];

  return [
    ...request,
    ...(input.versionCount && input.variantSeed !== undefined
      ? [
          `Estás generando la variante ${input.variantSeed + 1} de ${input.versionCount}.`,
          "Debe transmitir la misma información pero con una redacción, estructura de frases y orden de ideas claramente distintos de las otras variantes.",
        ]
      : []),
    `Negocio: ${input.workspace.name}`,
    `Ciudad: ${input.workspace.city}`,
    `Tipo de negocio: ${input.workspace.business_type}`,
    `Objetivo: ${input.workspace.goal}`,
    `Plataforma: ${input.platform}`,
    `Fotografía del menú: ${input.photo ? "adjunta para análisis visual" : "no adjunta"}`,
    `Tono solicitado: ${input.tone || "casual"}`,
    length === "short"
      ? `Extensión: texto corto de máximo ${SHORT_POST_MAX_CHARACTERS} caracteres.`
      : length === "long"
        ? "Extensión: texto largo de 700 a 1500 caracteres, organizado en varios párrafos y con una llamada a la acción clara."
      : "Extensión: texto estándar.",
    `Prioridad de contenido: ${input.workspace.content_focus}`,
    `Instagram: ${input.workspace.instagram_username || "no informado"}`,
    `Entrada: ${input.menu.starter}`,
    `Plato principal: ${input.menu.main_course}`,
    `Postre: ${input.menu.dessert}`,
    `Precio: $${input.menu.price.toLocaleString("es-CL")}`,
    `Saludo sugerido: ${input.context?.greeting || "saludo cercano"}`,
    `Día y hora local: ${input.context?.localTime || "no disponible"}`,
    `Momento del día: ${input.context?.timeOfDay || "no disponible"}`,
    `Clima actual: ${input.context?.weatherSummary || "no disponible"}`,
    ...(input.context?.seasonalEvent
      ? [
          `Fecha clave próxima: ${input.context.seasonalEvent.name}, en ${input.context.seasonalEvent.daysUntil} día(s)${
            input.context.seasonalEvent.weekendBoost === "largo"
              ? " (genera fin de semana largo)"
              : input.context.seasonalEvent.weekendBoost === "puente"
                ? " (posible puente)"
                : ""
          }. Si aporta valor, puedes mencionarla o invitar a planificar la visita para esa fecha, sin inventar promociones ni horarios especiales que no se hayan indicado.`,
        ]
      : []),
    "Dato obligatorio: el menú diario incluye jugo y pan amasado hecho en el local.",
  ].join("\n");
}
