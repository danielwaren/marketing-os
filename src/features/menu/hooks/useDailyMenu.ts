import { useEffect, useState } from "react";

import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";

import {
  createDailyMenu,
  getTodayMenu,
  updateDailyMenu,
  updateDailyMenuPhoto,
} from "../services/daily-menu.service";

import type {
  CreateDailyMenuDto,
  DailyMenu,
  UpdateDailyMenuDto,
} from "../types/daily-menu";

export function useDailyMenu() {
  const { workspace } = useWorkspace();

  const [menu, setMenu] = useState<DailyMenu | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!workspace) {
        setLoading(false);
        return;
      }

      const { data, error } = await getTodayMenu(workspace.id);

      if (!error) {
        setMenu((data as DailyMenu | null) ?? null);
      }

      setLoading(false);
    }

    load();
  }, [workspace]);

  async function create(menuData: CreateDailyMenuDto) {
    if (!workspace) {
      return {
        data: null,
        error: new Error("Workspace no encontrado"),
      };
    }

    const result = await createDailyMenu(workspace.id, menuData);

    if (!result.error && result.data) {
      setMenu(result.data as DailyMenu);
    }

    return result;
  }

  async function update(menuData: UpdateDailyMenuDto) {
    if (!menu) {
      return {
        data: null,
        error: new Error("No existe un menú para editar"),
      };
    }

    const result = await updateDailyMenu(menu.id, menuData);

    if (!result.error && result.data) {
      setMenu(result.data as DailyMenu);
    }

    return result;
  }

  async function setPhoto(mediaId: string) {
    if (!menu) {
      return {
        data: null,
        error: new Error("No existe un menú para hoy"),
      };
    }

    const result = await updateDailyMenuPhoto(menu.id, mediaId);

    if (!result.error && result.data) {
      setMenu(result.data as DailyMenu);
    }

    return result;
  }

  async function refresh() {
    if (!workspace) {
      return;
    }

    const { data, error } = await getTodayMenu(workspace.id);

    if (!error) {
      setMenu((data as DailyMenu | null) ?? null);
    }
  }

  return {
    menu,
    loading,
    create,
    update,
    setPhoto,
    refresh,
  };
}