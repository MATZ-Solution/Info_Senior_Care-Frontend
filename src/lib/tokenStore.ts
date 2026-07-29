// Plain localStorage-backed token storage, read directly by the API client
// (so every fetch can attach Authorization without going through React
// context) and mirrored into AuthContext state for the UI.

export type TokenType = "user" | "guest";

const TOKEN_KEY = "isc_token";
const TOKEN_TYPE_KEY = "isc_token_type";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getTokenType(): TokenType | null {
  return localStorage.getItem(TOKEN_TYPE_KEY) as TokenType | null;
}

export function setToken(token: string, type: TokenType): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_TYPE_KEY, type);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_TYPE_KEY);
}
