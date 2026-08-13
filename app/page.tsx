import type { Metadata } from "next";
import WebikoStage from "@/components/WebikoStage";
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
            webiko.dev
          </h1>
          <p>Please enable JavaScript to view this site.</p>
        </div>
      </noscript>
    </>
  );
}
