import { SectionHeading } from "@/components/section-heading";

const points = [
  {
    title: "Architecture and domain first",
    body: "The shape of the problem matters more than the newest stack. I start with how the work actually happens, then choose tools that can carry it.",
  },
  {
    title: "Between IT and the business",
    body: "Computer science plus an MBA is the working stance, not a detour. Software has to survive how organizations decide, buy, and change their minds.",
  },
  {
    title: "Build for real people",
    body: "Neighbors, volunteers, teams — the people who use a thing, not only the people who buy it. If it needs explaining twice, it is not finished.",
  },
] as const;

export function HowIWork() {
  return (
    <section aria-labelledby="how-i-work">
      <SectionHeading id="how-i-work">How I work</SectionHeading>
      <ul className="mt-6 space-y-7">
        {points.map((point) => (
          <li key={point.title} className="max-w-prose">
            <h3 className="font-display text-xl font-medium tracking-[-0.02em] text-ink">
              {point.title}
            </h3>
            <p className="mt-2 leading-relaxed text-ink-muted">{point.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
