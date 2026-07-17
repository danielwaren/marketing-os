import { supabase } from "@/lib/supabase";

import type {
  CreateDailyMenuDto,
  UpdateDailyMenuDto,
} from "../types/daily-menu";

const menuSelect = `
  *,
  media:media_id (
    file_path,
    file_name
  )
`;

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export async function createDailyMenu(
  workspaceId: string,
  menu: CreateDailyMenuDto
) {
  return await supabase
    .from("daily_menus")
    .insert({
      workspace_id: workspaceId,
      date: getTodayDate(),
      starter: menu.starter,
      main_course: menu.main_course,
      dessert: menu.dessert,
      price: menu.price,
      media_id: menu.media_id ?? null,
    })
    .select(menuSelect)
    .single();
}

export async function getTodayMenu(workspaceId: string) {
  return await supabase
    .from("daily_menus")
    .select(menuSelect)
    .eq("workspace_id", workspaceId)
    .eq("date", getTodayDate())
    .maybeSingle();
}

export async function updateDailyMenu(
  menuId: string,
  menu: UpdateDailyMenuDto
) {
  return await supabase
    .from("daily_menus")
    .update({
      starter: menu.starter,
      main_course: menu.main_course,
      dessert: menu.dessert,
      price: menu.price,
      media_id: menu.media_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", menuId)
    .select(menuSelect)
    .single();
}

export async function updateDailyMenuPhoto(
  menuId: string,
  mediaId: string
) {
  return await supabase
    .from("daily_menus")
    .update({
      media_id: mediaId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", menuId)
    .select(menuSelect)
    .single();
}