import { ImageResponse } from "next/og";
import { getSurvivalRating, getWinRate } from "@/lib/elo";
import { getShareIdea } from "@/lib/share-data";

export const alt = "Likelyr idea survival card";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = await getShareIdea(id);

  if (!idea) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#08070b", color: "#fff7ed", fontSize: 64, fontWeight: 900 }}>
        Idea not found
      </div>,
      size
    );
  }

  const survival = getSurvivalRating(idea.elo_score);
  const winRate = getWinRate(idea.wins, idea.losses);

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
          padding: 58,
          fontFamily: "Arial",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 80% 28%, rgba(238, 88, 42, 0.38), transparent 34%), linear-gradient(135deg, rgba(238, 88, 42, 0.14), transparent 50%)",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", color: "#ff8a4c" }}>
            Likelyr
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ border: "1px solid rgba(255,255,255,.18)", padding: "9px 14px", fontSize: 18, fontWeight: 800 }}>{idea.category}</div>
            <div style={{ border: "1px solid rgba(238,88,42,.5)", color: "#ff8a4c", padding: "9px 14px", fontSize: 18, fontWeight: 800 }}>{idea.stage}</div>
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ color: "#ff8a4c", fontSize: 22, fontWeight: 900, textTransform: "uppercase", letterSpacing: 3 }}>
              Can this survive?
            </div>
            {idea.user_name && (
              <div style={{ color: "#b8aaa3", fontSize: 20 }}>{`by ${idea.user_name}`}</div>
            )}
          </div>
          <div style={{ fontSize: 78, lineHeight: 0.95, fontWeight: 950, letterSpacing: -3, maxWidth: 920 }}>
            {idea.name}
          </div>
          <div style={{ fontSize: 27, lineHeight: 1.25, color: "#d8cdc6", maxWidth: 960 }}>
            {idea.pitch}
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", gap: 14 }}>
          <Metric label="Survival" value={`${survival}%`} accent="#f59e0b" />
          <Metric label="Win rate" value={`${winRate}%`} accent="#34d399" />
          <Metric label="Elo" value={String(idea.elo_score)} accent="#ff6b35" />
          <Metric label="Record" value={`${idea.wins}W/${idea.losses}L`} accent="#f3d6c3" />
        </div>
      </div>
    ),
    size
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.05)", padding: "16px 20px", minWidth: 170 }}>
      <div style={{ fontSize: 16, color: "#b8aaa3", textTransform: "uppercase", letterSpacing: 2, fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 36, color: accent, fontWeight: 950 }}>{value}</div>
    </div>
  );
}
