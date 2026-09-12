import { SectionHeading } from "@/components/section-heading";

const beats = [
  {
    era: "Engineer",
    roles: [
      "Software Developer, Merrill Lynch",
      "Engineering roles including Micropact and Secondmarket",
    ],
  },
  {
    era: "Leader",
    roles: [
      "VP of Software Development, Fix Flyer",
      "Senior / Lead Consultant, Infusion",
      "Group Manager / Senior Consultant, Avanade",
    ],
  },
  {
    era: "Architect / SE",
    roles: [
      "Senior Sales Engineer, Cisco",
      "Senior Solutions Architect, Mendix",
    ],
  },
  {
    era: "Founder",
    roles: ["Building RosterJoy"],
  },
] as const;

const education = [
  "BA, Computer Science — Emory University",
  "MS, Computer Science — Villanova University",
  "MBA — Wake Forest University",
] as const;

export function SelectedPath() {
  return (
    <section aria-labelledby="selected-path">
      <SectionHeading id="selected-path">Selected path</SectionHeading>
      <p className="mt-4 max-w-prose text-ink-muted">
        Engineer, then leader, then architect and sales engineer, now founder.
        High-level beats — not a résumé.
      </p>
      <ol className="mt-8 space-y-7">
        {beats.map((beat) => (
          <li key={beat.era}>
            <h3 className="font-sans text-[0.7rem] font-medium tracking-[0.16em] text-ink-faint uppercase">
              {beat.era}
            </h3>
            <ul className="mt-2 space-y-1.5 text-[1.05rem] text-ink">
              {beat.roles.map((role) => (
                <li key={role}>{role}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <div className="mt-10 max-w-prose border-t border-rule pt-6">
        <h3 className="font-sans text-[0.7rem] font-medium tracking-[0.16em] text-ink-faint uppercase">
          Education
        </h3>
        <ul className="mt-2 space-y-1.5 text-ink-muted">
          {education.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
