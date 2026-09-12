import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16">
      <p className="font-sans text-xs font-medium tracking-[0.18em] text-teal uppercase">
        404
      </p>
      <h1 className="mt-4 font-display text-4xl font-medium tracking-tight text-ink">
        This page isn&apos;t here.
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-muted">
        The address may have changed, or it never existed. Either way, the home
        page is still the right place to start.
      </p>
      <p className="mt-8">
        <Link
          href="/"
          className="font-sans text-sm font-medium text-teal-deep underline decoration-teal/30 underline-offset-4 transition-colors hover:text-teal hover:decoration-teal"
        >
          Back to calwatson.com
        </Link>
      </p>
    </main>
  );
}
