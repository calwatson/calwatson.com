import { ExternalLink } from "@/components/external-link";
import { links } from "@/lib/links";

export function Hero() {
  return (
    <header className="rise">
      <p className="font-sans text-xs font-medium tracking-[0.2em] text-teal uppercase">
        Columbia, South Carolina
      </p>
      <h1 className="mt-4 font-display text-[2.75rem] leading-none font-medium tracking-[-0.035em] text-ink sm:text-6xl">
        Cal Watson
      </h1>
      <p className="rise rise-delay-1 mt-5 max-w-md font-serif text-xl leading-snug text-ink sm:text-[1.35rem]">
        Founder and operator. Engineer who builds for real people.
      </p>
      <p className="rise rise-delay-1 mt-4 max-w-md leading-relaxed text-ink-muted">
        I design and ship software that has to survive contact with ordinary
        life — neighbors, teams, and the work in between.
      </p>
      <div className="rise rise-delay-2 mt-8 flex flex-wrap items-center gap-3">
        <ExternalLink
          href={links.rosterjoy}
          className="inline-flex items-center justify-center rounded-full bg-teal px-5 py-2.5 font-sans text-sm font-medium text-paper transition-colors hover:bg-teal-deep focus-visible:outline-offset-4"
        >
          See RosterJoy
          <span className="sr-only"> (opens in a new tab)</span>
        </ExternalLink>
        <ExternalLink
          href={links.linkedin}
          className="inline-flex items-center justify-center rounded-full px-4 py-2.5 font-sans text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          LinkedIn
          <span aria-hidden="true" className="ml-1.5">
            ↗
          </span>
          <span className="sr-only"> (opens in a new tab)</span>
        </ExternalLink>
      </div>
    </header>
  );
}
