import { bus, NAME_EVENT, type NameEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream. Every connected browser receives "new-name"
 * events the moment a donation is finalized — no refresh required.
 */
export async function GET() {
  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      send({ type: "hello" });

      const onName = (event: NameEvent) => send(event);
      bus.on(NAME_EVENT, onName);

      const ping = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 25_000);

      cleanup = () => {
        clearInterval(ping);
        bus.off(NAME_EVENT, onName);
      };
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
