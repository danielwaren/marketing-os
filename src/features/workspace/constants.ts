export const BUSINESS_TYPES = [
  "Restaurante",
  "Pizzería",
  "Cafetería",
  "Hostal",
] as const;

export const CONTENT_FOCUS = [
  { value: "menu", label: "Menú diario" },
  { value: "pizza", label: "Pizzas" },
  { value: "both", label: "Ambos" },
] as const;

export const GOALS = [
  { value: "sales", label: "Aumentar ventas" },
  { value: "followers", label: "Aumentar seguidores" },
  { value: "both", label: "Ambos" },
] as const;