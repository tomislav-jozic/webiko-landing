import { ImageResponse } from "next/og";
import { SITE_THEME_COLOR } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: SITE_THEME_COLOR,
        }}
      >
        <div style={{ display: "flex", fontSize: 108, color: "#ffffff", fontWeight: 300 }}>
          webiko.dev
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 32,
            color: "rgba(255,255,255,0.6)",
            fontWeight: 300,
          }}
        >
          Pixel-perfect frontend, WordPress & Laravel
        </div>
      </div>
    ),
    { ...size },
  );
}
