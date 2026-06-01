import { ImageResponse } from "next/og";

export const alt = "Likelyr startup idea validation by real votes";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08070b",
          color: "#fff7ed",
          padding: 64,
          fontFamily: "Arial",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 72% 22%, rgba(238, 88, 42, 0.35), transparent 34%), linear-gradient(135deg, rgba(238, 88, 42, 0.16), transparent 40%)",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, border: "3px solid #ee582a", transform: "rotate(45deg)" }} />
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>Likelyr</div>
          </div>
          <div style={{ border: "1px solid rgba(238,88,42,.45)", color: "#ff8a4c", padding: "10px 16px", fontSize: 18, fontWeight: 800, textTransform: "uppercase" }}>
            Live battles
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
          <div style={{ color: "#ff8a4c", fontSize: 24, fontWeight: 900, textTransform: "uppercase", letterSpacing: 4 }}>
            Startup idea validation
          </div>
          <div style={{ fontSize: 88, lineHeight: 0.92, fontWeight: 950, letterSpacing: -3 }}>
            Ideas ranked by real votes.
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.25, color: "#c7bdb7", maxWidth: 760 }}>
            Strangers vote on which idea is more likely to make money.
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", gap: 18, color: "#ffcfb3", fontSize: 22, fontWeight: 800 }}>
          <span>Submit</span>
          <span style={{ color: "#ee582a" }}>•</span>
          <span>Battle</span>
          <span style={{ color: "#ee582a" }}>•</span>
          <span>Survive</span>
        </div>
      </div>
    ),
    size
  );
}
