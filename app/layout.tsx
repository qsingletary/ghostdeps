import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GhostDeps - npm Dependency Health Scanner",
  description:
    "Visualize and analyze the health of npm package dependencies before you install them.",
  keywords: [
    "npm",
    "dependencies",
    "security",
    "vulnerability",
    "health check",
    "package analyzer",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />

        <link
          rel="icon"
          href="/favicon-light-32x32.png"
          sizes="32x32"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/favicon-dark-32x32.png"
          sizes="32x32"
          media="(prefers-color-scheme: dark)"
        />
        <link
          rel="apple-touch-icon"
          href="/favicon-light-180x180.png"
          sizes="180x180"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="apple-touch-icon"
          href="/favicon-dark-180x180.png"
          sizes="180x180"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body className="min-h-screen bg-bg font-sans text-fg antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
