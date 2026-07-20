import type { StoryPlanType } from "@/features/ai/types/story";

// Horarios fijos del negocio: almuerzo siempre a las 13:00,
// pizzas desde las 18:00 — ver generate-story para el mismo criterio.
const LUNCH_WINDOW = { startHour: 11, endHour: 15 };
const PIZZA_WINDOW = { startHour: 17, endHour: 21 };

export interface StoryPlan {
  type: StoryPlanType;
  label: string;
}

function isInWindow(
  hour: number,
  window: { startHour: number; endHour: number }
) {
  return hour >= window.startHour && hour < window.endHour;
}

// Decide qué tipo de historia conviene proponer ahora mismo, según la
// hora local y si hay menú del día creado (el tipo "lunch" lo necesita).
export function planStoryType(
  now: Date,
  hasMenuToday: boolean
): StoryPlan {
  const hour = now.getHours();

  if (hasMenuToday && isInWindow(hour, LUNCH_WINDOW)) {
    return {
      type: "lunch",
      label: "Historia de almuerzo (13:00)",
    };
  }

  if (isInWindow(hour, PIZZA_WINDOW)) {
    return {
      type: "pizza_night",
      label: "Historia de pizzas (18:00)",
    };
  }

  return {
    type: "general",
    label: "Historia del banco de contenido",
  };
}
