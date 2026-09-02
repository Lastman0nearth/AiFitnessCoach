export {};

declare global {
  interface Env {
    DB: D1Database;
    ASSETS: Fetcher;
    GEMINI_API_KEY: string;
  }
}
