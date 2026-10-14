import { currentFrame } from "@/lib/replay";
import { subscribe } from "@/lib/pubsub";
import type { StreamFrame } from "@/lib/types";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (frame: StreamFrame) => {
        const payload = JSON.stringify({ ...frame, renderedAt: Date.now() });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      send(currentFrame());

      const unsubscribe = subscribe(send);

      const keepalive = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15_000);

      const cleanup = () => {
        clearInterval(keepalive);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      };

      // Store cleanup for cancel
      (controller as unknown as { _cleanup?: () => void })._cleanup = cleanup;
    },
    cancel() {
      const self = this as unknown as { _cleanup?: () => void };
      self._cleanup?.();
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
