import Link from "next/link";
import { Button } from "@coursebuilder/ui";
import * as React from "react";
import { getServerAuthSession } from "@/server/auth";
import { getAbility } from "@/lib/ability";
import ReactMarkdown from "react-markdown";
import { getArticle } from "@/lib/articles";
import { notFound } from "next/navigation";
import { type Metadata, type ResolvingMetadata } from "next";
import { getOGImageUrlForTitle } from "@/utils/get-og-image-for-title";

type Props = {
  params: { article: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const article = await getArticle(params.article);

  if (!article) {
    return parent as Metadata;
  }

  const previousImages = (await parent).openGraph?.images || [];

  const ogImage = getOGImageUrlForTitle(article.title);

  return {
    title: article.title,
    openGraph: {
      images: [ogImage, ...previousImages],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { article: string };
}) {
  const session = await getServerAuthSession();
  const ability = getAbility({ user: session?.user });
  const article = await getArticle(params.article);

  if (!article) {
    notFound();
  }

  return (
    <div>
      {ability.can("update", "Content") ? (
        <div className="flex h-9 w-full items-center justify-between bg-muted px-1">
          <div />
          <Button asChild className="h-7">
            <Link href={`/articles/${article.slug || article._id}/edit`}>
              Edit
            </Link>
          </Button>
        </div>
      ) : null}
      <article className="flex flex-col p-5 sm:p-10">
        <h1 className="text-3xl font-bold">{article.title}</h1>

        <div className="mt-4 pb-32">
          <ReactMarkdown className="prose dark:prose-invert">
            {article.body}
          </ReactMarkdown>
          <ReactMarkdown>{article.description}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
