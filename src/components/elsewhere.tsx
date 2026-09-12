import { ExternalLink } from "@/components/external-link";
import { SectionHeading } from "@/components/section-heading";
import { links } from "@/lib/links";

const places = [
  { label: "LinkedIn", href: links.linkedin },
  { label: "GitHub", href: links.github },
  { label: "RosterJoy", href: links.rosterjoy },
] as const;

export function Elsewhere() {
  return (
    <section aria-labelledby="elsewhere">
      <SectionHeading id="elsewhere">Elsewhere</SectionHeading>
      <p className="mt-4 max-w-prose text-ink-muted">
        The best places to find me. I don&apos;t publish an email here.
      </p>
      <ul className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
        {places.map((place) => (
          <li key={place.label}>
            <ExternalLink
              href={place.href}
              className="font-sans text-sm font-medium text-ink underline decoration-rule underline-offset-4 transition-colors hover:text-teal-deep hover:decoration-teal"
            >
              {place.label}
              <span aria-hidden="true"> ↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </ExternalLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
