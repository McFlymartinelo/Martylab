import { Toast as ToastPrimitive } from "@base-ui/react/toast";

export interface ToastOptions {
  title: string;
  description?: string;
  type?: "success" | "error" | "info";
}

/**
 * Petit wrapper de notifications. Les messages confirment une action déjà
 * exécutée par le serveur : ils ne remplacent jamais un contrôle d'accès.
 */
export function useToast() {
  const manager = ToastPrimitive.useToastManager();

  return {
    show(options: ToastOptions) {
      manager.add({
        title: options.title,
        description: options.description,
        type: options.type ?? "info",
      });
    },
  };
}
