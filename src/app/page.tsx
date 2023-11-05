import { Metadata } from "next"
import {Separator} from "@/components/ui/separator";
import {getServerAuthSession} from "@/server/auth";
import {getAbility} from "@/lib/ability";
import * as React from "react";
import {redirect} from "next/navigation";
import VideoUploader from "@/components/video-uploader";
import {ChatResponse} from "@/app/_components/chat-response";
import { UploadButton } from "@/utils/uploadthing";

export const metadata: Metadata = {
  title: "Media Processing Workflow",
  description: "Combines the power of OpenAI's API with the flexibility of a custom workflow in Inngest.",
}

export default async function PlaygroundPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})

  if(!ability.can('view', 'Anything')) {
    redirect('/login')
  }

  return  (
    <>
      <div className="hidden h-full flex-col md:flex">
        <div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
          <h2 className="text-lg font-semibold">Video Processor</h2>
        </div>
        <Separator />
        <div className="container h-full py-6">
          <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
            <div className="md:order-1">



                <VideoUploader />

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
