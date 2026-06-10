type Level = "info" | "warn" | "error";

function log(level: Level, event: string, ctx: Record<string, unknown> = {}) {
  const entry = { level, event, ts: new Date().toISOString(), ...ctx };
  if (level === "error") console.error(JSON.stringify(entry));
  else if (level === "warn") console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

export const logger = {
  info: (event: string, ctx?: Record<string, unknown>) => log("info", event, ctx),
  warn: (event: string, ctx?: Record<string, unknown>) => log("warn", event, ctx),
  error: (event: string, ctx?: Record<string, unknown>) => log("error", event, ctx),
};