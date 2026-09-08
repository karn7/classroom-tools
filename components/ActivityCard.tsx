import Link from "next/link";

type ActivityCardProps = {
  href: string;
  emoji: string;
  title: string;
  description: string;
  accent: string;
  compact?: boolean;
};

export default function ActivityCard({
  href,
  emoji,
  title,
  description,
  accent,
  compact = false,
}: ActivityCardProps) {
  return (
    <Link
      href={href}
      className={`group bg-white shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-200 ${
        compact
          ? "flex min-h-28 items-center gap-4 rounded-3xl p-4"
          : "min-h-56 rounded-[1.75rem] p-6"
      }`}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br ${accent} shadow-sm transition duration-200 group-hover:scale-105 ${
          compact ? "h-16 w-16 text-4xl" : "h-20 w-20 text-5xl"
        }`}
        aria-hidden="true"
      >
        {emoji}
      </div>
      <div>
        <h2
          className={`font-black leading-tight text-slate-950 ${
            compact ? "text-2xl sm:text-3xl" : "mt-7 text-3xl sm:text-4xl"
          }`}
        >
          {title}
        </h2>
        <p
          className={`font-medium leading-relaxed text-slate-600 ${
            compact ? "mt-1 text-lg" : "mt-4 text-xl"
          }`}
        >
          {description}
        </p>
      </div>
    </Link>
  );
}
