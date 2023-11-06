import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {TipUploader} from "@/app/tips/_components/tip-uploader";
import { Suspense } from "react";
import {Form} from "@/components/ui/form";
import { NewTipForm } from "./new-tip-form";

export function CreateTip() {
  return (
    <Suspense>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">Create a Tip</CardTitle>
        <svg
          className=" w-4 h-4 text-zinc-500 dark:text-zinc-400"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
          <path d="M9 18h6" />
          <path d="M10 22h4" />
        </svg>
      </CardHeader>
      <CardContent>
<NewTipForm/>
      </CardContent>
      <CardFooter>

      </CardFooter>
    </Card>
    </Suspense>
  )
}