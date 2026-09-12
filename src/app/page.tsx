import { BuildingNow } from "@/components/building-now";
import { Elsewhere } from "@/components/elsewhere";
import { Hero } from "@/components/hero";
import { HowIWork } from "@/components/how-i-work";
import { SelectedPath } from "@/components/selected-path";
import { SiteFooter } from "@/components/site-footer";

const nav = [
  { href: "#building-now", label: "Building" },
  { href: "#how-i-work", label: "Work" },
  { href: "#selected-path", label: "Path" },
  { href: "#elsewhere", label: "Elsewhere" },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-paper-raised focus:px-3 focus:py-2 focus:font-sans focus:text-sm focus:text-ink"
      >
        Skip to content
      </a>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 sm:px-8 lg:px-10">
        <div className="lg:grid lg:grid-cols-[minmax(0,20.5rem)_minmax(0,1fr)] lg:gap-20 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:gap-28">
          <div className="flex flex-col pt-8 pb-12 lg:sticky lg:top-0 lg:min-h-dvh lg:justify-between lg:py-14">
            <div>
              <div className="flex items-center justify-between gap-4">
                <span
                  aria-hidden="true"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-teal font-display text-sm font-medium text-paper"
                >
                  C
                </span>
                <nav aria-label="On this page" className="hidden sm:block lg:hidden">
                  <ul className="flex gap-5 font-sans text-xs font-medium tracking-wide text-ink-muted">
                    {nav.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          className="transition-colors hover:text-ink"
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
              <div className="mt-10 lg:mt-16">
                <Hero />
              </div>
            </div>
            <nav
              aria-label="On this page"
              className="mt-12 hidden lg:block"
            >
              <ul className="space-y-2.5 font-sans text-sm text-ink-muted">
                {nav.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="transition-colors hover:text-ink"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <main
            id="content"
            className="flex flex-col gap-16 border-t border-rule py-12 lg:border-t-0 lg:py-14 lg:pl-4"
          >
            <BuildingNow />
            <HowIWork />
            <SelectedPath />
            <Elsewhere />
          </main>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
