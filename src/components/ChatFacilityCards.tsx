import { useState } from "react";
import type { ChatFacilityCard } from "../lib/types";

export default function ChatFacilityCards({ cards }: { cards: ChatFacilityCard[] }) {
  const [index, setIndex] = useState(0);
  const card = cards[index];
  const hasMultiple = cards.length > 1;

  return (
    <div style={{ marginTop: 10, maxWidth: 340 }}>
      <ChatCard card={card} />
      {hasMultiple && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8 }}>
          <button
            className="btn btn-ghost btn-sm"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {index + 1} / {cards.length}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={index === cards.length - 1}
            onClick={() => setIndex((i) => Math.min(cards.length - 1, i + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function ChatCard({ card }: { card: ChatFacilityCard }) {
  if (card.source === "cms_certified") {
    return (
      <div style={{ background: "#fff", border: "1.5px solid var(--green)", borderRadius: 16, padding: 16, boxShadow: "var(--shadow-soft)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>{card.name}</div>
          <span className="pill pill-green">✓ CMS certified</span>
        </div>
        {card.facility_type_label && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{card.facility_type_label}</div>}
        {(card.city || card.state) && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{[card.city, card.state].filter(Boolean).join(", ")}</div>
        )}
        {card.phone && <div style={{ fontSize: 12, color: "var(--navy)", marginBottom: 6 }}>📞 {card.phone}</div>}
        {card.highlight && <span className="pill pill-teal">{card.highlight}</span>}
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1.5px solid var(--gold)", borderRadius: 16, padding: 16, boxShadow: "var(--shadow-soft)" }}>
      <span className="pill pill-gold" style={{ marginBottom: 8, display: "inline-block" }}>
        Not CMS-certified — from general web search
      </span>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>
        {card.url ? (
          <a href={card.url} target="_blank" rel="noreferrer" style={{ color: "var(--teal)" }}>
            {card.title}
          </a>
        ) : (
          card.title
        )}
      </div>
      {card.snippet && <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{card.snippet}</div>}
    </div>
  );
}
