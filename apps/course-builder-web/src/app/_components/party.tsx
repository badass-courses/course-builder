"use client";

import { useSocket } from "@/hooks/use-socket";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";

export function Party({ room }: { room?: string }) {
  const utils = api.useUtils();
  const router = useRouter();
  useSocket({
    room,
    onMessage: async (messageEvent) => {
      try {
        const data = JSON.parse(messageEvent.data);
        const invalidateOn = [
          "videoResource.created",
          "video.asset.ready",
          "transcript.ready",
          "ai.tip.draft.completed",
        ];

        if (invalidateOn.includes(data.name)) {
          await utils.module.invalidate();
          router.refresh();
        }
      } catch (error) {
        // noting to do
      }
    },
  });

  return null;
}
