import { cn } from "@/lib/utils";

const palette = [
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-violet-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-indigo-500 to-blue-500",
];

function hashName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function AppIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const gradient = palette[hashName(name) % palette.length];

  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-semibold text-white",
        gradient,
        className,
      )}
      aria-hidden="true"
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
