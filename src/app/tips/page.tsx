import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card"
import {getServerAuthSession} from "@/server/auth";
import {getAbility} from "@/lib/ability";
import {CreateTip} from "@/app/tips/_components/create-tip";
import {getTipsModule} from "@/lib/tips";

export default async function TipsListPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})

  const tipsModule = await getTipsModule()

  return (
    <div className="flex flex-col">
      {ability.can('upload', 'Media') ? <CreateTip/> : null}
      <div className="mt-2">
        <h3 className="text-lg font-bold">Published Tips</h3>
        {tipsModule.tips.map(tip => (
          <Card key={tip._id}>
            <CardHeader>
              <CardTitle>{tip.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {tip.description}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
