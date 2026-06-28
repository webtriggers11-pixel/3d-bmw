/**
 * Fetch + parse JSON defensively.
 *
 * A plain `await fetch(url).then((r) => r.json())` throws the cryptic
 * "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 * whenever the body is empty or not JSON — e.g. an unhandled 500 (no body) or
 * an HTML error page. This reads the body once, parses it safely, and surfaces
 * a clean Error message instead. Client-safe (no server imports).
 */
export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);
  const text = await res.text();

  let data: unknown;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON body (HTML error page, plain text, etc.) — leave data undefined.
    }
  }

  if (!res.ok) {
    const fromBody = (data as { error?: string } | undefined)?.error;
    throw new Error(
      fromBody || res.statusText || `Request failed (${res.status})`,
    );
  }

  return data as T;
}
