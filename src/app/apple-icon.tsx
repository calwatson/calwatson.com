import { ImageResponse } from "next/og";

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
          background: "#0f766e",
          color: "#f6f5f2",
          fontSize: 84,
          fontWeight: 650,
          letterSpacing: "-0.05em",
          fontFamily: "Georgia, Times New Roman, serif",
        }}
      >
        C
      </div>
    ),
    { ...size },
  );
}
