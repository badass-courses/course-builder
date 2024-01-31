import * as React from "react";
import { getServerAuthSession } from "@/server/auth";
import { getAbility } from "@/lib/ability";
import { notFound, redirect } from "next/navigation";
import { api } from "@/trpc/server";
import VideoUploader from "@/components/video-uploader";
import ModuleEdit from "@/components/module-edit";

export const dynamic = "force-dynamic";

export default async function EditTutorialPage({
  params,
}: {
  params: { module: string };
}) {
  const session = await getServerAuthSession();
  const ability = getAbility({ user: session?.user });

  if (!ability.can("update", "Content")) {
    redirect("/login");
  }

  const tutorial = await api.module.getTutorial.query({ slug: params.module });

  if (!tutorial) {
    notFound();
  }

  return (
    <>
      <ModuleEdit tutorial={tutorial} />
      <div className="flex flex-col">
        <VideoUploader moduleSlug={params.module} />
      </div>
    </>
  );
}
