import type { Metadata } from "next";
import "./v2.css";

export const metadata: Metadata = {
  title: "Parrot — Loppet är hjälten",
  description:
    "Din AI-träningscoach som tar dig hela vägen till mållinjen i exakt det lopp du förbereder dig för.",
};

export default function V2Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* Tanker display face (Fontshare). Falls back to the app's display font offline.
          Loaded here, scoped to v2 — the original layout is untouched. */}
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=tanker@400&display=swap"
      />
      <div className="v2-scope">{children}</div>
    </>
  );
}
