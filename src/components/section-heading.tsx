type SectionHeadingProps = {
  id: string;
  children: string;
};

export function SectionHeading({ id, children }: SectionHeadingProps) {
  return (
    <h2
      id={id}
      className="font-sans text-xs font-medium tracking-[0.2em] text-teal uppercase"
    >
      {children}
    </h2>
  );
}
