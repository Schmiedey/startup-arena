import { ImageResponse } from "next/og";
import { getShareBattle } from "@/lib/share-data";

export const alt = "Likelyr battle card";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const battle = await getShareBattle(id);

  if (!battle) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#08070b", color: "#fff7ed", fontSize: 64, fontWeight: 900 }}>
        Battle not found
      </div>,
      size
    );
  }

  const leftWon = battle.winner?.id === battle.idea_a.id;
  const rightWon = battle.winner?.id === battle.idea_b.id;
  const headline = battle.winner && battle.loser
    ? `${battle.winner.name} won Elo`
    : "Guess the crowd";

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
          padding: 54,
          fontFamily: "Arial",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 48%, rgba(238, 88, 42, 0.34), transparent 30%), linear-gradient(135deg, rgba(238,88,42,.1), transparent 48%)",
          }}
        />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ color: "#ff8a4c", fontSize: 24, fontWeight: 900, textTransform: "uppercase", letterSpacing: 3 }}>
            Likelyr Battle
          </div>
          <div style={{ border: "1px solid rgba(238,88,42,.45)", color: "#ff8a4c", padding: "9px 14px", fontSize: 18, fontWeight: 900 }}>
            Vote now
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 58, lineHeight: 0.98, fontWeight: 950, letterSpacing: 0, textAlign: "center" }}>
            {headline}
          </div>

          <div style={{ display: "flex", alignItems: "stretch", gap: 20 }}>
            <BattleIdea side="A" name={battle.idea_a.name} pitch={battle.idea_a.pitch} category={battle.idea_a.category} elo={battle.idea_a.elo_score} winner={leftWon} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 86, fontSize: 34, fontWeight: 950, color: "#ff8a4c" }}>
              VS
            </div>
            <BattleIdea side="B" name={battle.idea_b.name} pitch={battle.idea_b.pitch} category={battle.idea_b.category} elo={battle.idea_b.elo_score} winner={rightWon} />
          </div>
        </div>

        <div style={{ position: "relative", textAlign: "center", fontSize: 24, color: "#c7bdb7", fontWeight: 800 }}>
          Vote on the community split and challenge the result.
        </div>
      </div>
    ),
    size
  );
}

function BattleIdea({
  side,
  name,
  pitch,
  category,
  elo,
  winner,
}: {
  side: string;
  name: string;
  pitch: string;
  category: string;
  elo: number;
  winner: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 250,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: winner ? "3px solid #ee582a" : "1px solid rgba(255,255,255,.16)",
        background: winner ? "rgba(238,88,42,.14)" : "rgba(255,255,255,.05)",
        padding: 26,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: winner ? "#ee582a" : "rgba(255,255,255,.1)", color: winner ? "#160803" : "#ffcfb3", fontSize: 20, fontWeight: 950 }}>
          {side}
        </div>
        <div style={{ color: winner ? "#ff8a4c" : "#b8aaa3", fontSize: 17, fontWeight: 900, textTransform: "uppercase" }}>
          {winner ? "Elo win" : category}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 38, lineHeight: 1, fontWeight: 950 }}>{name}</div>
        <div style={{ fontSize: 20, lineHeight: 1.25, color: "#c7bdb7" }}>{pitch}</div>
      </div>
      <div style={{ color: "#ff8a4c", fontSize: 22, fontWeight: 900 }}>{`${elo} Elo`}</div>
    </div>
  );
}
