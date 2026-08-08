import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FullPageStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  iconClassName?: string;
  spin?: boolean;
}

export function FullPageState({
  icon: Icon,
  title,
  description,
  action,
  iconClassName,
  spin = false,
}: FullPageStateProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground",
              iconClassName,
            )}
          >
            <Icon className={cn("size-5", spin && "animate-spin")} aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <p className="text-base font-medium">{title}</p>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </CardContent>
      </Card>
    </div>
  );
}
