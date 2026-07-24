import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

import {
  workspaceSchema,
  type WorkspaceSchema,
} from "../schemas/workspace.schema";

import { createWorkspace } from "../services/workspace.service";

export function WorkspaceForm() {
  const [formError, setFormError] =
    useState<string | null>(null);

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
    setFormError(null);

    const { error } = await createWorkspace({
      ...data,
      instagram_username: data.instagram_username ?? "",
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    window.location.href = "/app";
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>
            {formError}
          </AlertDescription>
        </Alert>
      )}
      <div>
        <label
          htmlFor="workspace-name"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Nombre del negocio
        </label>

        <Input
          id="workspace-name"
          {...register("name")}
        />

        {errors.name && (
          <p className="mt-1.5 text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="workspace-business-type"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Tipo de negocio
        </label>

        <Input
          id="workspace-business-type"
          {...register("business_type")}
        />
      </div>

      <div>
        <label
          htmlFor="workspace-city"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Ciudad
        </label>

        <Input
          id="workspace-city"
          {...register("city")}
        />
      </div>

      <div>
        <label
          htmlFor="workspace-instagram"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Usuario de Instagram
        </label>

        <Input
          id="workspace-instagram"
          {...register("instagram_username")}
        />
      </div>

      <div>
        <label
          htmlFor="workspace-content-focus"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Contenido principal
        </label>

        <Select
          id="workspace-content-focus"
          {...register("content_focus")}
        >
          <option value="menu">Menú diario</option>
          <option value="pizza">Pizzas</option>
          <option value="both">Ambos</option>
        </Select>
      </div>

      <div>
        <label
          htmlFor="workspace-goal"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Objetivo
        </label>

        <Select
          id="workspace-goal"
          {...register("goal")}
        >
          <option value="sales">Ventas</option>
          <option value="followers">Seguidores</option>
          <option value="both">Ambos</option>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Guardando..." : "Configurar negocio"}
      </Button>
    </form>
  );
}
