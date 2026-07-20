// Calcula feriados chilenos sin depender de una API externa: los feriados
// de fecha fija están hardcodeados y los movibles (Viernes Santo, y los
// dos feriados que la Ley 19.668 traslada al lunes más cercano) se
// calculan. Así la sugerencia del dashboard no depende de red y funciona
// siempre, a costa de no detectar feriados "puente" ad-hoc que el
// Congreso a veces declara para un año específico.
import type { WeekendBoost } from "../types/ai.ts";

interface Holiday {
  name: string;
  date: Date;
}

function toUtcDate(
  year: number,
  month: number,
  day: number
) {
  return new Date(Date.UTC(year, month - 1, day));
}

// Algoritmo de Gauss/Anónimo para calcular el domingo de Pascua.
function getEasterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return toUtcDate(year, month, day);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);

  result.setUTCDate(result.getUTCDate() + days);

  return result;
}

// Ley 19.668: si el 29 de junio o el 12 de octubre no caen lunes, se
// trasladan al lunes más cercano (hacia atrás si caen mar-jue, hacia
// adelante si caen vie-dom).
function nearestMonday(date: Date) {
  const weekday = date.getUTCDay();

  if (weekday === 1) return date;

  if (weekday >= 2 && weekday <= 4) {
    return addDays(date, -(weekday - 1));
  }

  const forward = weekday === 0 ? 1 : 8 - weekday;

  return addDays(date, forward);
}

export function getChileHolidays(year: number): Holiday[] {
  const easter = getEasterSunday(year);

  return [
    { name: "Año Nuevo", date: toUtcDate(year, 1, 1) },
    { name: "Viernes Santo", date: addDays(easter, -2) },
    {
      name: "Día del Trabajo",
      date: toUtcDate(year, 5, 1),
    },
    {
      name: "Glorias Navales",
      date: toUtcDate(year, 5, 21),
    },
    {
      name: "San Pedro y San Pablo",
      date: nearestMonday(toUtcDate(year, 6, 29)),
    },
    {
      name: "Virgen del Carmen",
      date: toUtcDate(year, 7, 16),
    },
    {
      name: "Asunción de la Virgen",
      date: toUtcDate(year, 8, 15),
    },
    {
      name: "Fiestas Patrias",
      date: toUtcDate(year, 9, 18),
    },
    {
      name: "Glorias del Ejército",
      date: toUtcDate(year, 9, 19),
    },
    {
      name: "Encuentro de Dos Mundos",
      date: nearestMonday(toUtcDate(year, 10, 12)),
    },
    {
      name: "Día de las Iglesias Evangélicas",
      date: toUtcDate(year, 10, 31),
    },
    {
      name: "Día de Todos los Santos",
      date: toUtcDate(year, 11, 1),
    },
    {
      name: "Inmaculada Concepción",
      date: toUtcDate(year, 12, 8),
    },
    { name: "Navidad", date: toUtcDate(year, 12, 25) },
  ];
}

function getWeekendBoost(date: Date): WeekendBoost {
  const weekday = date.getUTCDay();

  if (weekday === 1 || weekday === 5) return "largo";

  if (weekday === 2 || weekday === 4) return "puente";

  return null;
}

export interface UpcomingSeasonalEvent {
  name: string;
  date: string;
  daysUntil: number;
  weekendBoost: WeekendBoost;
}

function startOfUtcDay(date: Date) {
  return toUtcDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

export function getUpcomingSeasonalEvent(
  from = new Date(),
  lookAheadDays = 21
): UpcomingSeasonalEvent | null {
  const today = startOfUtcDay(from);
  const candidates = [
    ...getChileHolidays(today.getUTCFullYear()),
    ...getChileHolidays(today.getUTCFullYear() + 1),
  ];

  const upcoming = candidates
    .map((holiday) => {
      const daysUntil = Math.round(
        (holiday.date.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return { ...holiday, daysUntil };
    })
    .filter(
      (holiday) =>
        holiday.daysUntil >= 0 &&
        holiday.daysUntil <= lookAheadDays
    )
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const next = upcoming[0];

  if (!next) return null;

  return {
    name: next.name,
    date: next.date.toISOString().slice(0, 10),
    daysUntil: next.daysUntil,
    weekendBoost: getWeekendBoost(next.date),
  };
}

export function formatSeasonalMessage(
  event: UpcomingSeasonalEvent
) {
  const dateLabel = new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${event.date}T00:00:00Z`));

  const when =
    event.daysUntil === 0
      ? "es hoy"
      : event.daysUntil === 1
        ? "es mañana"
        : `es en ${event.daysUntil} días`;

  const boost =
    event.weekendBoost === "largo"
      ? "Se viene un fin de semana largo"
      : event.weekendBoost === "puente"
        ? "Se arma un posible puente"
        : "Se viene una fecha importante";

  return `${boost}: ${event.name} (${dateLabel}) ${when}. Buen momento para preparar una publicación.`;
}
