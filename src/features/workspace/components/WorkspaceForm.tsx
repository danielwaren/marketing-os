import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  workspaceSchema,
  type WorkspaceSchema,
} from "../schemas/workspace.schema";

import { createWorkspace } from "../services/workspace.service";

export function WorkspaceForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WorkspaceSchema>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "Hostal Monchito",
      business_type: "Restaurante",
      city: "Puerto Cisnes",
      instagram_username: "hostalmonchito",
      content_focus: "both",
      goal: "both",
    },
  });

  async function onSubmit(data: WorkspaceSchema) {
    const { error } = await createWorkspace(data);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/app";
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      <div>
        <Input
          placeholder="Nombre del negocio"
          {...register("name")}
        />
        <p className="text-sm text-red-500">{errors.name?.message}</p>
      </div>

      <div>
        <Input
          placeholder="Tipo de negocio"
          {...register("business_type")}
        />
      </div>

      <div>
        <Input
          placeholder="Ciudad"
          {...register("city")}
        />
      </div>

      <div>
        <Input
          placeholder="Instagram"
          {...register("instagram_username")}
        />
      </div>

      <div>
        <label>Contenido principal</label>

        <select
          {...register("content_focus")}
          className="w-full rounded-md border p-2"
        >
          <option value="menu">Menú diario</option>
          <option value="pizza">Pizzas</option>
          <option value="both">Ambos</option>
        </select>
      </div>

      <div>
        <label>Objetivo</label>

        <select
          {...register("goal")}
          className="w-full rounded-md border p-2"
        >
          <option value="sales">Ventas</option>
          <option value="followers">Seguidores</option>
          <option value="both">Ambos</option>
        </select>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        Configurar negocio
      </Button>
    </form>
  );
}