// Lightweight moderation + sanitization for public names/messages.
// Not exhaustive — a v1 safety floor (brief: profanity filter + sanitization).
// Admin hide/delete is the backstop for anything that slips through.

const BANNED = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "asshole",
  "bastard",
  "dick",
  "pussy",
  "nigger",
  "faggot",
  "rape",
  "slut",
  "whore",
];

/** Strip HTML/scripts, control chars, zero-width chars; collapse whitespace. */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // tags
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, "") // control chars
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalise common leetspeak so "sh1t" / "f@ck" are still caught. */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4@]/g, "a")
    .replace(/[0]/g, "o")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[^a-z ]/g, "");
}

export type ModerationResult = { ok: true } | { ok: false; reason: string };

/** Reject banned words and URLs in the name/message. */
export function moderate(name: string, message?: string): ModerationResult {
  const haystack = normalise(`${name} ${message ?? ""}`);
  const compact = haystack.replace(/ /g, "");
  for (const word of BANNED) {
    if (haystack.includes(word) || compact.includes(word)) {
      return { ok: false, reason: "Contains disallowed language." };
    }
  }
  if (/(https?:\/\/|www\.|\.[a-z]{2,}\/)/i.test(`${name} ${message ?? ""}`)) {
    return { ok: false, reason: "Links are not allowed." };
  }
  return { ok: true };
}
