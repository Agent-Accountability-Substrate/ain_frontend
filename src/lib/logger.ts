/**
 * Structured JSON-lines logger — the single sanctioned `console` user
 * in this codebase (hence the one eslint-disable below). All other
 * modules must log through this file.
 *
 * Conventions:
 * - Event names are static strings (e.g. "resolver.lookup_failed");
 *   anything dynamic goes into the structured `fields` object.
 * - One JSON object per line: { timestamp, level, event, ...fields }.
 * - Never log secrets, key material, or PII in `fields`.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

function emit(level: LogLevel, event: string, fields?: LogFields): void {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  // eslint-disable-next-line no-console -- sole sanctioned console sink; see header comment.
  console[level](line);
}

export const logger = {
  debug(event: string, fields?: LogFields): void {
    emit("debug", event, fields);
  },
  info(event: string, fields?: LogFields): void {
    emit("info", event, fields);
  },
  warn(event: string, fields?: LogFields): void {
    emit("warn", event, fields);
  },
  error(event: string, fields?: LogFields): void {
    emit("error", event, fields);
  },
};
