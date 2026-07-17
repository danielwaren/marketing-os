import type {
  GeneratePostInput,
} from "../../types/ai.ts";
import type {
  AIProvider,
} from "./ai-provider.interface.ts";
import {
  createLocalGenerationContext,
} from "../weather.service.ts";
import {
  addSmartEmojis,
  appendRelevantHashtags,
  REQUIRED_MENU_INCLUSION,
} from "../../prompts/post.prompt.ts";

const VARIANT_INTROS: Array<
  (name: string, city: string) => string
> = [
  (name, city) =>
    `Hoy en ${name} preparamos algo especial para ti en ${city}.`,
  (name, city) =>
    `¿Ya sabes qué almorzar hoy? En ${name}, ${city}, tenemos la respuesta.`,
  (name, city) =>
    `En ${name} el almuerzo de hoy está listo para disfrutar en ${city}.`,
];

function getVariantIntro(
  input: GeneratePostInput
) {
  if (
    input.variantSeed === undefined ||
    input.variantSeed === 0
  ) {
    return null;
  }

  const variant =
    VARIANT_INTROS[
      input.variantSeed % VARIANT_INTROS.length
    ];

  return variant(
    input.workspace.name,
    input.workspace.city
  );
}

function getToneGreeting(
  input: GeneratePostInput,
  greeting: string
) {
  if (input.tone === "formal") {
    return `${greeting}\n\nEstimados clientes,`;
  }

  if (input.tone === "promotional") {
    return `${greeting}\n\nHoy tenemos una rica alternativa para disfrutar.`;
  }

  return greeting;
}

function getToneClosing(
  input: GeneratePostInput,
  city: string,
  instagram: string | undefined
) {
  const contact = instagram
    ? input.tone === "formal"
      ? `Para pedidos y consultas, contáctenos en ${instagram}.`
      : `Para pedidos y consultas, escríbenos a ${instagram}.`
    : input.tone === "formal"
      ? "Contáctenos para realizar su pedido o consultar disponibilidad."
      : "Escríbenos para hacer tu pedido o consultar disponibilidad.";

  if (input.tone === "formal") {
    return [
      `Agradecemos su preferencia y le esperamos en ${city}.`,
      contact,
    ];
  }

  if (input.tone === "promotional") {
    return [
      `No te quedes sin tu menú de hoy. Te esperamos en ${city}.`,
      contact,
    ];
  }

  return [
    `Te esperamos en ${city}.`,
    contact,
  ];
}

export class TemplatesProvider
  implements AIProvider {
  readonly name = "templates" as const;

  async generatePost(
    input: GeneratePostInput
  ) {
    const context =
      input.context ??
      createLocalGenerationContext();
    const instagram =
      input.workspace.instagram_username?.trim();
    const greeting = getToneGreeting(
      input,
      context.greeting
    );
    const closing = getToneClosing(
      input,
      input.workspace.city,
      instagram
    );
    const variantIntro = getVariantIntro(input);

    if (input.action === "hashtags") {
      return {
        text: appendRelevantHashtags(
          input.sourceText ?? "",
          input
        ),
        provider: this.name,
        fallback: false,
        context,
      };
    }

    if (input.action === "emojis") {
      return {
        text: addSmartEmojis(
          input.sourceText ?? "",
          input
        ),
        provider: this.name,
        fallback: false,
        context,
      };
    }

    if (input.length === "long") {
      const text = [
        greeting,
        "",
        ...(variantIntro ? [variantIntro, ""] : []),
        `En ${input.workspace.name} ya tenemos preparado el almuerzo de hoy para quienes buscan comida casera, abundante y hecha con dedicación en ${input.workspace.city}.`,
        "",
        `Para comenzar tendremos ${input.menu.starter}. Como plato principal serviremos ${input.menu.main_course}, y para cerrar el almuerzo podrás disfrutar ${input.menu.dessert}. El valor del menú es $${input.menu.price.toLocaleString("es-CL")}.`,
        "",
        REQUIRED_MENU_INCLUSION,
        "Queremos que encuentres una alternativa completa y preparada especialmente para esta jornada, tanto si vives en la zona como si estás visitando Puerto Cisnes o trabajando por algunos días.",
        "",
        context.weatherSummary
          ? `Hoy tenemos ${context.weatherSummary.toLocaleLowerCase("es-CL")}, así que una comida recién preparada es una buena forma de acompañar el día.`
          : "Una comida recién preparada siempre es una buena forma de hacer una pausa y disfrutar el día.",
        "",
        "También contamos con nuestras pizzas artesanales con delivery, preparadas para compartir en familia, con amigos o después de una jornada de trabajo.",
        "",
        ...closing,
      ].join("\n");

      return {
        text,
        provider: this.name,
        fallback: true,
        context,
      };
    }

    if (input.length === "short") {
      const weatherLine =
        context.isRaining || context.isCold
          ? "Ideal para disfrutar caliente hoy."
          : null;
      const text = [
        greeting,
        variantIntro,
        `Menú de hoy en ${input.workspace.name}: entrada ${input.menu.starter}, principal ${input.menu.main_course} y postre ${input.menu.dessert}.`,
        `Valor: $${input.menu.price.toLocaleString("es-CL")}.`,
        REQUIRED_MENU_INCLUSION,
        weatherLine,
        ...closing,
      ]
        .filter(Boolean)
        .join("\n\n");

      return {
        text,
        provider: this.name,
        fallback: true,
        context,
      };
    }

    if (input.action === "rewrite") {
      const text = [
        greeting,
        "",
        ...(variantIntro ? [variantIntro, ""] : []),
        `Hoy tenemos almuerzo casero en ${input.workspace.name}.`,
        `Comenzamos con ${input.menu.starter}.`,
        `El plato principal es ${input.menu.main_course} y para terminar tenemos ${input.menu.dessert}.`,
        "",
        `El valor del menú es $${input.menu.price.toLocaleString("es-CL")}.`,
        REQUIRED_MENU_INCLUSION,
        "",
        context.weatherSummary
          ? `El clima está ${context.weatherSummary.toLocaleLowerCase("es-CL")}; te esperamos con comida preparada para disfrutar hoy.`
          : "Te esperamos con comida preparada especialmente para hoy.",
        "",
        ...closing,
      ].join("\n");

      return {
        text,
        provider: this.name,
        fallback: true,
        context,
      };
    }

    const text = [
      greeting,
      "",
      ...(variantIntro ? [variantIntro, ""] : []),
      `Hoy en ${input.workspace.name}:`,
      "",
      `Entrada: ${input.menu.starter}`,
      `Plato principal: ${input.menu.main_course}`,
      `Postre: ${input.menu.dessert}`,
      `Valor: $${input.menu.price.toLocaleString("es-CL")}`,
      "",
      REQUIRED_MENU_INCLUSION,
      "",
      context.weatherSummary
        ? `Con ${context.weatherSummary.toLocaleLowerCase("es-CL")}, te esperamos con comida casera preparada para hoy.`
        : "Te esperamos con comida casera preparada para hoy.",
      "",
      "También puedes pedir nuestras pizzas artesanales con delivery.",
      "",
      ...closing,
    ].join("\n");

    return {
      text,
      provider: this.name,
      fallback: true,
      context,
    };
  }
}
