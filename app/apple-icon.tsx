import { ImageResponse } from "next/og";
import { SITE_THEME_COLOR } from "@/lib/site";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: SITE_THEME_COLOR,
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: 110,
            fontWeight: 600,
          }}
        >
          w
        </span>
      </div>
    ),
    { ...size },
  );
}
