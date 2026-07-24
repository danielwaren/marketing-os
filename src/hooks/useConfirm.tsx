import { useCallback, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

// Reemplaza window.confirm() por un diálogo propio, manteniendo la misma
// forma de uso: `const ok = await confirm({ title, description })`.
export function useConfirm() {
  const [options, setOptions] =
    useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<
    ((value: boolean) => void) | null
  >(null);

  const confirm = useCallback(
    (nextOptions: ConfirmOptions) => {
      setOptions(nextOptions);

      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
      });
    },
    []
  );

  function settle(value: boolean) {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOptions(null);
  }

  const dialog = options ? (
    <ConfirmDialog
      open
      title={options.title}
      description={options.description}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      variant={options.variant}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  ) : null;

  return { confirm, dialog };
}
