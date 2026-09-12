import type { Metadata } from "next";
import { Fraunces, Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://calwatson.com"),
  title: {
    default: "Cal Watson",
    template: "%s · Cal Watson",
  },
  description:
    "Founder and operator. Engineer who builds for real people. Building RosterJoy from Columbia, South Carolina.",
  applicationName: "Cal Watson",
  authors: [{ name: "Cal Watson", url: "https://calwatson.com" }],
  creator: "Cal Watson",
  keywords: [
    "Cal Watson",
    "RosterJoy",
    "founder",
    "operator",
    "engineer",
    "Columbia South Carolina",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://calwatson.com",
    siteName: "Cal Watson",
    title: "Cal Watson",
    description:
      "Founder and operator. Engineer who builds for real people. Building RosterJoy from Columbia, South Carolina.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cal Watson",
    description:
      "Founder and operator. Engineer who builds for real people. Building RosterJoy from Columbia, South Carolina.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${sourceSerif.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper font-serif text-ink">{children}</body>
    </html>
  );
}
