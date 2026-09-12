import { ImageResponse } from "next/og";

export const alt = "Cal Watson — founder, operator, and engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f6f5f2",
          padding: "72px 80px",
          color: "#1c1917",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#0f766e",
            fontFamily: "Georgia, Times New Roman, serif",
          }}
        >
          calwatson.com
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 92,
              lineHeight: 1,
              fontWeight: 560,
              letterSpacing: "-0.03em",
              fontFamily: "Georgia, Times New Roman, serif",
            }}
          >
            Cal Watson
          </div>
          <div
            style={{
              marginTop: 28,
              maxWidth: 820,
              fontSize: 34,
              lineHeight: 1.35,
              color: "#57534e",
              fontFamily: "Georgia, Times New Roman, serif",
            }}
          >
            Founder and operator. Engineer who builds for real people.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#78716c",
            fontFamily: "Georgia, Times New Roman, serif",
          }}
        >
          Columbia, South Carolina · Building RosterJoy
        </div>
      </div>
    ),
    { ...size },
  );
}
