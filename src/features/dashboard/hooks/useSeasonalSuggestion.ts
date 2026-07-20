import { useMemo } from "react";

import {
  formatSeasonalMessage,
  getUpcomingSeasonalEvent,
} from "@/features/ai/services/seasonal.service";

// Se calcula localmente (sin red) apenas se monta el dashboard, así la
// tarjeta aparece de inmediato en vez de esperar una llamada al servidor.
export function useSeasonalSuggestion() {
  return useMemo(() => {
    const event = getUpcomingSeasonalEvent();

    if (!event) {
      return { available: false as const, event: null, message: null };
    }

    return {
      available: true as const,
      event,
      message: formatSeasonalMessage(event),
    };
  }, []);
}
