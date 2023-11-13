import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card"
import {getServerAuthSession} from "@/server/auth";
import {getAbility} from "@/lib/ability";
import {CreateTip} from "@/app/tips/_components/create-tip";
import {getTipsModule} from "@/lib/tips";
import * as React from "react";
import {TipPlayer} from "@/app/tips/_components/tip-player";
import {Button} from "@/components/ui/button";
import {inngest} from "@/inngest/inngest.server";
import {AI_TIP_WRITING_REQUESTED_EVENT} from "@/inngest/events";
import {Party} from "@/app/tips/_components/party";
import {Textarea} from "@/components/ui/textarea";
import {Input} from "@/components/ui/input";

export default async function TipsListPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})
  const tipsModule = await getTipsModule()

  return (
    <div className="flex flex-col">
      {ability.can('upload', 'Media') ? <CreateTip/> : null}
      <div className="mt-2">
        <h3 className="text-lg font-bold">Published Tips</h3>
        <Party />
        {tipsModule.tips.map(tip => (
          <Card key={tip._id}>
            <CardHeader>
              <CardTitle>{tip.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {tip.summary}
              <TipPlayer videoResourceId={tip.videoResourceId} muxPlaybackId={tip.muxPlaybackId}/>
              {ability.can('upload', 'Media') ? (
                <div className='flex flex-col'>
                  <form className='flex flex-col' action={async (data) => {
                    "use server"
                    console.log('submit', {data})
                  }}>
                    <Input value={tip.title} type="text" placeholder="Title" />
                    <Textarea  rows={10} value={tip.summary} placeholder="Summary" />
                    <Textarea rows={10} value={tip.body} placeholder="Description" />
                    <Button type="submit">Save Tip</Button>
                  </form>
                  <div className="flex">
                    <form action={async (data) => {
                      "use server"
                      await inngest.send({
                        name: AI_TIP_WRITING_REQUESTED_EVENT,
                        data: {
                          tipId: tip._id
                        }
                      })
                    }}>
                      <Button type="submit">Re-Generate Title</Button>
                    </form>
                    <form>
                      <Button type="submit">Generate Su</Button>
                    </form>
                  </div>
                </div>
              ) : null}

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
