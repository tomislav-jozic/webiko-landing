import { ImageResponse } from "next/og";
import { SITE_THEME_COLOR } from "@/lib/site";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 14,
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: 40,
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
