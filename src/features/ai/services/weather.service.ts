import type {
  GeneratePostContext,
} from "../types/ai.ts";

const DEFAULT_TIME_ZONE =
  "America/Punta_Arenas";

interface WeatherApiResponse {
  location?: {
    localtime?: string;
    tz_id?: string;
  };
  current?: {
    temp_c?: number;
    feelslike_c?: number;
    precip_mm?: number;
    condition?: {
      text?: string;
    };
  };
}

function getWeekday(
  date: Date,
  timeZone: string
) {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    timeZone,
  })
    .format(date)
    .toLocaleLowerCase("es-CL");
}

function getHour(
  date: Date,
  timeZone: string
) {
  return Number(
    new Intl.DateTimeFormat("es-CL", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone,
    }).format(date)
  );
}

function getTimeOfDay(hour: number) {
  if (hour < 12) {
    return "mañana" as const;
  }

  if (hour < 20) {
    return "tarde" as const;
  }

  return "noche" as const;
}

function getGreeting(weekday: string) {
  if (weekday === "viernes") {
    return "¡Bienvenido viernes!";
  }

  return `¡Buen ${weekday}!`;
}

function getPhotoSuggestion(
  isRaining: boolean,
  isCold: boolean
) {
  if (isRaining || isCold) {
    return "Usa una foto real del plato principal servido caliente o de una pizza artesanal recién horneada.";
  }

  return "Usa una foto real y cercana del plato principal del día, mostrando una porción generosa.";
}

export function createLocalGenerationContext(
  date = new Date(),
  timeZone = DEFAULT_TIME_ZONE
): GeneratePostContext {
  const weekday = getWeekday(date, timeZone);
  const hour = getHour(date, timeZone);
  const isCold = false;
  const isRaining = false;

  return {
    weekday,
    localTime: new Intl.DateTimeFormat(
      "es-CL",
      {
        dateStyle: "full",
        timeStyle: "short",
        timeZone,
      }
    ).format(date),
    timeOfDay: getTimeOfDay(hour),
    greeting: getGreeting(weekday),
    weatherSummary: null,
    isRaining,
    isCold,
    photoSuggestion: getPhotoSuggestion(
      isRaining,
      isCold
    ),
    weatherSource: null,
  };
}

export async function getGenerationContext(
  city: string,
  apiKey: string
) {
  if (!apiKey) {
    return createLocalGenerationContext();
  }

  let response: Response;

  try {
    const url = new URL(
      "https://api.weatherapi.com/v1/current.json"
    );

    url.searchParams.set("key", apiKey);
    url.searchParams.set("q", `${city}, Chile`);
    url.searchParams.set("lang", "es");

    response = await fetch(url);
  } catch {
    return createLocalGenerationContext();
  }

  if (!response.ok) {
    return createLocalGenerationContext();
  }

  let data: WeatherApiResponse;

  try {
    data = await response.json() as WeatherApiResponse;
  } catch {
    return createLocalGenerationContext();
  }

  const timeZone =
    data.location?.tz_id ?? DEFAULT_TIME_ZONE;
  const localDate = data.location?.localtime
    ? new Date(
        data.location.localtime.replace(" ", "T")
      )
    : new Date();
  const base = createLocalGenerationContext(
    localDate,
    timeZone
  );
  const temperature = data.current?.temp_c;
  const feelsLike = data.current?.feelslike_c;
  const condition =
    data.current?.condition?.text?.trim();
  const isRaining =
    (data.current?.precip_mm ?? 0) > 0;
  const isCold =
    typeof temperature === "number" &&
    temperature <= 12;
  const weatherSummary = [
    condition,
    typeof temperature === "number"
      ? `${temperature} °C`
      : null,
    typeof feelsLike === "number"
      ? `sensación de ${feelsLike} °C`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    ...base,
    weatherSummary:
      weatherSummary || null,
    isRaining,
    isCold,
    photoSuggestion: getPhotoSuggestion(
      isRaining,
      isCold
    ),
    weatherSource: "WeatherAPI.com" as const,
  };
}
