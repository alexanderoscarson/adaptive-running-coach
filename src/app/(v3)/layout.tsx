import type { Metadata } from "next";
import "./v3.css";

export const metadata: Metadata = {
  title: "Parrot — träna mot ett riktigt lopp",
  description:
    "Välj ett lopp — Vasaloppet, Vätternrundan, ditt första 5 km eller ditt tionde maraton — och få ett träningsschema som byggs efter det, hela vägen till start.",
};

export default function V3Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* Tanker display face (Fontshare stylesheet — not an npm dependency).
          Scoped to the v3 surface; falls back to the app's display font offline. */}
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=tanker@400&display=swap"
      />
      <div className="v3-scope">{children}</div>
    </>
  );
}
