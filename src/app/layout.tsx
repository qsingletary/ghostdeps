import type { Metadata } from "next";
import "./globals.css";

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
