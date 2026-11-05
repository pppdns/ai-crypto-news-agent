/**
 * Parses the response body of POST /ask (see app/ask/route.ts).
 *
 * The body is the answer's raw text tokens, followed by trailer events of the form
 * `\ndata: {json}\n\n`: a `cleanedText` event (answer with citation markers removed),
 * a `citations` event, or an `error` event. The "No recent news" path sends plain text only.
 *
 * Usage: accumulate the decoded body into one string and call `parseAskStream(raw)` after
 * every chunk. It is pure and tolerant of partial input, so it is safe mid-stream. While the
 * raw tokens stream in, citation markers are hidden (including a half-received one at the end)
 * so they never flash on screen before `cleanedText` arrives.
 */
import type { Citation } from '@/lib/client/types';

const EVENT_PREFIX = '\ndata: ';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
/** Same marker formats the server strips in lib/server/rag/citations.ts, plus leading spaces */
const CITATION_MARKER = new RegExp(`[ \\t]*\\[(?:Article ID:\\s*|\\d+:\\s*)?${UUID}\\]`, 'gi');
const TRAILING_BRACKET = /[ \t]*\[[^\]\n]*$/;
const MARKER_PREFIX = '[article id:';

/** True if `fragment` (starting with "[") could still grow into a citation marker */
function isPartialMarker(fragment: string): boolean {
  const lower = fragment.toLowerCase();
  if (MARKER_PREFIX.startsWith(lower) || lower.startsWith(MARKER_PREFIX)) return true;
  return /^\[(?:\d+:\s*)?[0-9a-f-]*$/.test(lower);
}

/** Removes complete citation markers, and a trailing incomplete one, from streamed text */
export function hideCitationMarkers(text: string): string {
  let visible = text.replace(CITATION_MARKER, '');
  const trailing = visible.match(TRAILING_BRACKET);
  if (trailing && isPartialMarker(trailing[0].trimStart())) {
    visible = visible.slice(0, trailing.index);
  }
  return visible;
}

export interface ParsedAskStream {
  answer: string;
  citations: Citation[] | null;
  error: string | null;
}

type StreamEvent =
  | { type: 'cleanedText'; text: string }
  | { type: 'citations'; citations: Citation[] }
  | { type: 'error'; message: string };

function isStreamEvent(value: unknown): value is StreamEvent {
  if (typeof value !== 'object' || value === null || !('type' in value)) return false;
  const event = value as Record<string, unknown>;
  switch (event.type) {
    case 'cleanedText':
      return typeof event.text === 'string';
    case 'citations':
      return Array.isArray(event.citations);
    case 'error':
      return typeof event.message === 'string';
    default:
      return false;
  }
}

export function parseAskStream(raw: string): ParsedAskStream {
  const eventsStart = raw.indexOf(EVENT_PREFIX);
  const result: ParsedAskStream = {
    answer: hideCitationMarkers(eventsStart === -1 ? raw : raw.slice(0, eventsStart)),
    citations: null,
    error: null,
  };

  if (eventsStart === -1) return result;

  for (const line of raw.slice(eventsStart).split('\n')) {
    if (!line.startsWith('data: ')) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(line.slice('data: '.length));
    } catch {
      // Incomplete event (still streaming) or not JSON: ignore it.
      continue;
    }
    if (!isStreamEvent(parsed)) continue;

    if (parsed.type === 'cleanedText') result.answer = parsed.text;
    else if (parsed.type === 'citations') result.citations = parsed.citations;
    else result.error = parsed.message;
  }

  return result;
}

/** Extracts a readable message from a failed /ask response body (JSON or plain text). */
export function getAskErrorMessage(body: string, status: number): string {
  try {
    const json: unknown = JSON.parse(body);
    if (typeof json === 'object' && json !== null) {
      const { message, error } = json as Record<string, unknown>;
      if (typeof message === 'string' && message) return message;
      if (typeof error === 'string' && error) return error;
    }
  } catch {
    // Not JSON
  }
  return body.trim() || `Request failed with status ${status}`;
}
