import type { Metadata } from "next";
import WebikoStage from "@/components/WebikoStage";
import { HERO_WORD, NOSCRIPT_MESSAGE } from "@/lib/copy";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      <WebikoStage />
      <noscript>
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            color: "#fff",
            background: "#0b0c08",
            fontFamily: "sans-serif",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <h1 style={{ fontSize: "clamp(32px, 8vw, 64px)", fontWeight: 300 }}>
            {HERO_WORD}
          </h1>
          <p>{NOSCRIPT_MESSAGE}</p>
        </div>
      </noscript>
    </>
  );
}
