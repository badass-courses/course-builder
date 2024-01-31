import { useSocket } from "@/hooks/use-socket";
import { api } from "@/trpc/react";
import React from "react";

export const CloudinaryMediaBrowser = () => {
  const utils = api.useUtils();

  const { data: images = [] } = api.imageResources.getAll.useQuery();

  useSocket({
    onMessage: (messageEvent) => {
      try {
        const messageData = JSON.parse(messageEvent.data);
        if (messageData.name === "cloudinary.asset.created") {
          utils.imageResources.getAll.invalidate();
        }
      } catch (error) {
        // noting to do
      }
    },
  });

  return (
    <div>
      <h3 className="inline-flex px-5 text-lg font-bold">Media Browser</h3>
      <div className="grid grid-cols-3 gap-1 p-2">
        {images.map((asset) => {
          return asset?.url ? (
            <div
              key={asset._id}
              className="flex aspect-square items-center justify-center overflow-hidden rounded border"
            >
              <img
                src={asset.url}
                alt={asset._id}
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    "text/plain",
                    `![](${e.currentTarget.src})`,
                  );
                }}
              />
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
};
