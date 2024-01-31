import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerAuthSession } from "@/server/auth";
import { getAbility } from "@/lib/ability";
import { inngest } from "@/inngest/inngest.server";
import { VIDEO_UPLOADED_EVENT } from "@/inngest/events/video-uploaded";
import { z } from "zod";
import { UTApi } from "uploadthing/server";

const f = createUploadthing();

export const utapi = new UTApi();

export const ourFileRouter = {
  videoUploader: f({ video: { maxFileSize: "2GB", maxFileCount: 5 } })
    .input(
      z.object({
        moduleSlug: z.string().optional(),
      }),
    )
    .middleware(async ({ req, input }) => {
      const session = await getServerAuthSession();
      const ability = getAbility({ user: session?.user });

      if (!session || !ability.can("create", "Content")) {
        throw new Error("Unauthorized");
      }

      return {
        userId: session.user.id,
        ...(input?.moduleSlug && { moduleSlug: input.moduleSlug }),
      };
    })
    .onUploadComplete(async (opts) => {
      await inngest.send({
        name: VIDEO_UPLOADED_EVENT,
        data: {
          originalMediaUrl: opts.file.url,
          fileName: opts.file.name || "untitled",
          title: opts.file.name || "untitled",
          moduleSlug: opts.metadata.moduleSlug,
          fileKey: opts.file.key,
        },
      });
    }),
  tipUploader: f({ video: { maxFileSize: "2GB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getServerAuthSession();
      const ability = getAbility({ user: session?.user });

      if (!session || !ability.can("create", "Content")) {
        throw new Error("Unauthorized");
      }

      return { userId: session.user.id, moduleSlug: "tips" };
    })
    .onUploadComplete(async (opts) => {
      console.debug("Upload complete for userId:", opts.metadata.userId);
      console.debug("file url", opts);

      await inngest.send({
        name: VIDEO_UPLOADED_EVENT,
        data: {
          originalMediaUrl: opts.file.url,
          fileName: opts.file.name || "untitled",
          title: opts.file.name || "untitled",
          moduleSlug: "tips",
          fileKey: opts.file.key,
        },
      });
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
