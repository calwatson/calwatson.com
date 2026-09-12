import { ExternalLink } from "@/components/external-link";
import { SectionHeading } from "@/components/section-heading";
import { links } from "@/lib/links";

export function BuildingNow() {
  return (
    <section aria-labelledby="building-now" className="rise rise-delay-1">
      <SectionHeading id="building-now">Building now</SectionHeading>
      <h3 className="mt-4 font-display text-2xl font-medium tracking-[-0.02em] text-ink sm:text-[1.75rem]">
        RosterJoy
      </h3>
      <p className="mt-2 font-serif text-lg text-ink-muted">
        Elegant signup sheets for real life.
      </p>
      <div className="mt-5 max-w-prose space-y-4 text-[1.05rem] leading-relaxed text-ink">
        <p>
          Potlucks, meal trains, volunteer shifts, snack schedules — the
          sign-up still lives in a spreadsheet or a group thread. It works
          until the link disappears, two people bring dessert, or a slot sits
          empty.
        </p>
        <p>
          RosterJoy is a quieter alternative: name the moment, add the slots,
          send a link that looks like you meant it. Warm enough for a neighbor.
          Clear enough for a team.
        </p>
      </div>
      <p className="mt-6">
        <ExternalLink
          href={links.rosterjoy}
          className="font-sans text-sm font-medium text-teal-deep underline decoration-teal/30 underline-offset-4 transition-colors hover:text-teal hover:decoration-teal"
        >
          rosterjoy.com
          <span aria-hidden="true"> ↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </ExternalLink>
      </p>
    </section>
  );
}
