import type { ReactNode } from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function Toaster() {
  const { toasts } = ToastPrimitive.useToastManager();

  return (
    <ToastPrimitive.Portal>
      <ToastPrimitive.Viewport className="pointer-events-none fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-80">
        {toasts.map((toast) => (
          <ToastPrimitive.Root
            key={toast.id}
            toast={toast}
            className={cn(
              "pointer-events-auto rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg",
              "data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-2",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-2",
            )}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <ToastPrimitive.Title className="text-sm font-medium" />
                <ToastPrimitive.Description className="mt-0.5 text-xs text-muted-foreground" />
              </div>
              <ToastPrimitive.Close
                aria-label="Fermer la notification"
                className="rounded p-1 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <X className="size-3.5" aria-hidden="true" />
              </ToastPrimitive.Close>
            </div>
          </ToastPrimitive.Root>
        ))}
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <ToastPrimitive.Provider timeout={4000} limit={3}>
      {children}
      <Toaster />
    </ToastPrimitive.Provider>
  );
}
