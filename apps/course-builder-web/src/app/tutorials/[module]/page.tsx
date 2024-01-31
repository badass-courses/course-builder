import { getServerAuthSession } from "@/server/auth";
import { getAbility } from "@/lib/ability";
import { notFound, redirect } from "next/navigation";
import { Separator } from "@coursebuilder/ui";
import * as React from "react";
import { sanityQuery } from "@/server/sanity.server";
import Link from "next/link";

export default async function ModulePage({
  params,
}: {
  params: { module: string };
}) {
  const session = await getServerAuthSession();
  const ability = getAbility({ user: session?.user });

  if (!ability.can("read", "Content")) {
    redirect("/login");
  }

  const course = await sanityQuery<{ title: string; description: string }>(
    `*[_type == "module" && moduleType == 'tutorial' && (_id == "${params.module}" || slug.current == "${params.module}")][0]`,
  );

  if (!course) {
    notFound();
  }

  return (
    <div className="hidden h-full flex-col md:flex">
      <div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
        <h2 className="text-lg font-semibold">{course.title}</h2>
        <p>{course.description}</p>
        {ability.can("update", "Content") && (
          <Link href={`/tutorials/${params.module}/edit`}>edit module</Link>
        )}
      </div>
      <Separator />
    </div>
  );
}
