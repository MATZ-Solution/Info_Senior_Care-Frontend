import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { WS_BASE_URL, chatApi } from "../lib/api";
import type { ChatMessage, ChatReplyEvent, ChatSessionSummary } from "../lib/types";
import ChatFacilityCards from "../components/ChatFacilityCards";

type ConnStatus = "connecting" | "open" | "reconnecting" | "disconnected";

const MAX_ATTEMPTS = 5;
const GREETING: ChatMessage = {
  role: "assistant",
  content: "Hi, I'm Infomary — your AI senior care companion. Tell me about the care situation you're navigating, and I'll help you find options.",
  facility_cards: null,
};

function pendingKey(sessionId: string) {
  return `isc_chat_pending_${sessionId}`;
}

export default function Chat() {
  const [params, setParams] = useSearchParams();
  const sessionId = params.get("session");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [status, setStatus] = useState<ConnStatus>("connecting");
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const isNewSessionRef = useRef(false);
  const hasTitledRef = useRef(false);
  const lastSentUserMessageRef = useRef<string>("");
  const messagesBoxRef = useRef<HTMLDivElement | null>(null);
  const didFirstScrollRef = useRef(false);

  // Scroll the message list itself -- scrollIntoView() also scrolls the window,
  // which parked the whole page down at the footer on every visit.
  useEffect(() => {
    messagesRef.current = messages;
    const box = messagesBoxRef.current;
    if (!box) return;
    box.scrollTo({ top: box.scrollHeight, behavior: didFirstScrollRef.current ? "smooth" : "auto" });
    didFirstScrollRef.current = true;
  }, [messages]);

  const refreshSessions = useCallback(() => {
    chatApi
      .sessions()
      .then((res) => setSessions(res.sessions))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // Ensure a session id always exists in the URL.
  useEffect(() => {
    if (!sessionId) {
      const next = new URLSearchParams(params);
      next.set("session", crypto.randomUUID());
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const connect = useCallback((sid: string) => {
    setStatus((prev) => (prev === "open" ? prev : "connecting"));
    const ws = new WebSocket(`${WS_BASE_URL}/ws/${sid}`);
    wsRef.current = ws;

    ws.onopen = () => {
      attemptRef.current = 0;
      setStatus("open");
      const raw = localStorage.getItem(pendingKey(sid));
      if (raw) {
        ws.send(raw);
        localStorage.removeItem(pendingKey(sid));
        setSending(true);
      }
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      let data: ChatReplyEvent;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      setSending(false);
      const priorAssistantCount = messagesRef.current.filter((m) => m.role === "assistant").length;
      const shouldTitle = isNewSessionRef.current && priorAssistantCount === 0 && !hasTitledRef.current;

      setMessages((prev) => [...prev, { role: "assistant", content: data.response, facility_cards: data.facility_cards ?? null }]);

      if (shouldTitle) {
        hasTitledRef.current = true;
        chatApi
          .generateTitle(sid, lastSentUserMessageRef.current, data.response)
          .then(() => refreshSessions())
          .catch(() => {});
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      // A drop mid-reply must not leave `sending` stuck true forever -- that
      // would permanently disable the Send button until a page reload, since
      // nothing else would ever flip it back.
      setSending(false);
      if (attemptRef.current >= MAX_ATTEMPTS) {
        setStatus("disconnected");
        return;
      }
      setStatus("reconnecting");
      const delay = Math.min(2000 * 2 ** attemptRef.current, 10000);
      attemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => connect(sid), delay);
    };

    ws.onerror = () => {
      // onclose follows and drives the reconnect.
    };
  }, [refreshSessions]);

  // (Re)connect whenever the session changes.
  useEffect(() => {
    if (!sessionId) return;

    setMessages([]);
    setLoadingHistory(true);
    hasTitledRef.current = false;
    attemptRef.current = 0;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

    chatApi
      .history(sessionId)
      .then((res) => {
        isNewSessionRef.current = res.messages.length === 0;
        setMessages(res.messages.length > 0 ? res.messages : [GREETING]);
      })
      .catch(() => {
        isNewSessionRef.current = true;
        setMessages([GREETING]);
      })
      .finally(() => setLoadingHistory(false));

    connect(sessionId);

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  function handleNewConversation() {
    const next = new URLSearchParams();
    next.set("session", crypto.randomUUID());
    setParams(next);
  }

  async function handleDeleteSession(id: string) {
    try {
      await chatApi.deleteSession(id);
    } catch {
      // best-effort
    }
    refreshSessions();
    if (id === sessionId) handleNewConversation();
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    // Block sending while a reply is still in flight -- one turn at a time.
    // The input itself stays editable so the user can keep typing/queue up
    // their next message, they just can't fire it off until this one lands.
    if (!text || !sessionId || sending) return;

    const historyForSend = messagesRef.current
      .filter((m) => m !== GREETING)
      .map((m) => ({ role: m.role, content: m.content }));

    lastSentUserMessageRef.current = text;
    setMessages((prev) => [...prev, { role: "user", content: text, facility_cards: null }]);
    setDraft("");
    setSending(true);

    const payload = JSON.stringify({ message: text, history: historyForSend });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(payload);
    } else {
      localStorage.setItem(pendingKey(sessionId), payload);
    }
  }

  function handleManualRetry() {
    if (!sessionId) return;
    attemptRef.current = 0;
    connect(sessionId);
  }

  return (
    <div className="chat-layout">
      <aside className="chat-sidebar">
        <div style={{ padding: 16, borderBottom: "1px solid var(--g3)" }}>
          <button className="btn btn-primary btn-block" onClick={handleNewConversation}>
            + New conversation
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {sessions.length === 0 && <div style={{ padding: 12, fontSize: 13, color: "var(--muted)" }}>No conversations yet.</div>}
          {sessions.map((s) => (
            <div key={s.session_id} className={`chat-session-item${s.session_id === sessionId ? " active" : ""}`} onClick={() => setParams({ session: s.session_id })}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.title || "New Conversation"}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(s.created_at).toLocaleString()}</div>
              </div>
              <button
                aria-label="Delete conversation"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(s.session_id);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 13, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </aside>

      <div className="chat-center">
        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--g3)", display: "flex", alignItems: "center", gap: 12 }}>
          <div className="chat-avatar" style={{ border: "2px solid var(--teal)" }}>🌿</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)" }}>Infomary</div>
            <div style={{ fontSize: 12, color: status === "open" ? "var(--teal)" : "var(--muted)" }}>
              {status === "open" && "● Connected"}
              {status === "connecting" && "Connecting…"}
              {status === "reconnecting" && "● Reconnecting…"}
              {status === "disconnected" && "○ Disconnected"}
            </div>
          </div>
        </div>

        {status === "disconnected" && (
          <div className="state-banner error" style={{ margin: "12px 24px 0" }}>
            <span>Disconnected — messages won't send.</span>
            <button className="btn btn-sm btn-primary" onClick={handleManualRetry} style={{ marginLeft: "auto" }}>
              Retry
            </button>
          </div>
        )}

        <div className="chat-messages" ref={messagesBoxRef}>
          {loadingHistory && <div className="muted center">Loading conversation…</div>}
          {!loadingHistory &&
            messages.map((m, i) => (
              <div key={i} className="chat-bubble-row" style={m.role === "user" ? { justifyContent: "flex-end" } : undefined}>
                {m.role === "assistant" && <div className="chat-avatar">🌿</div>}
                <div>
                  <div className={`chat-bubble ${m.role}`}>
                    {m.role === "assistant" ? (
                      <div className="chat-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                  {m.facility_cards && m.facility_cards.length > 0 && <ChatFacilityCards cards={m.facility_cards} />}
                </div>
              </div>
            ))}
          {sending && (
            <div className="chat-bubble-row">
              <div className="chat-avatar">🌿</div>
              <div className="chat-bubble">Thinking…</div>
            </div>
          )}
        </div>

        <div className="chat-input-bar">
          <form onSubmit={handleSend} style={{ display: "flex", gap: 10, alignItems: "center", background: "var(--g1)", borderRadius: 14, padding: "10px 14px", border: "1px solid var(--g3)" }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask Infomary anything about senior care…"
              style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, outline: "none" }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!draft.trim() || sending}>
              {sending ? "Sending…" : "Send →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
