/**
 * v0 by Vercel.
 * @see https://v0.dev/t/kjDAPmzUC6C
 */
import Link from 'next/link'
import {
  CardTitle,
  CardHeader,
  CardContent,
  Card,
  CardFooter,
} from '@/components/ui/card'
import {Button} from '@/components/ui/button'

export default function Component() {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Create a Tip</CardTitle>
          <svg
            className=" h-4 w-4 text-zinc-500 dark:text-zinc-400"
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
          <div className="text-lg font-bold">Enter your tip summary here</div>
          <p className="mt-2 text-sm">
            Your summary will be used to generate the title and draft body text
            based on the transcript of the video.
          </p>
          <textarea
            aria-label="Enter your tip summary here"
            className="mt-2 h-20 w-full rounded-md border p-2"
          />
          <div className="mt-4 text-lg font-bold">
            Upload your tip video here
          </div>
          <input
            aria-label="Upload your tip video here"
            className="mt-2 h-20 w-full rounded-md border p-2"
            type="file"
          />
          <Button className="mt-2" variant="default">
            Submit Tip
          </Button>
          <div className="mt-4 border-t pt-4">
            <h2 className="text-lg font-bold">Ideas for New Tips</h2>
            <ul className="list-inside list-disc">
              <li>Tip Idea 1</li>
              <li>Tip Idea 2</li>
              <li>Tip Idea 3</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <div className="mt-4 border-t pt-4">
            <h2 className="text-lg font-bold">Recently Created Tips</h2>
            <div className="mt-2">
              <h3 className="text-lg font-bold">Unpublished Tips</h3>
              <Card>
                <CardHeader>
                  <CardTitle>Tip 1</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline">Edit</Button>
                  <Button variant="outline">Publish</Button>
                  <Button variant="outline">Generate Title</Button>
                  <Button variant="outline">Generate Summary</Button>
                </CardContent>
              </Card>
            </div>
            <div className="mt-2">
              <h3 className="text-lg font-bold">Published Tips</h3>
              <Card>
                <CardHeader>
                  <CardTitle>TypeScript: The Basics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Views: 1200</p>
                  <img
                    alt="Graph for Tip 2"
                    className="object-cover"
                    height="50"
                    src="/placeholder.svg"
                    style={{
                      aspectRatio: '100/50',
                      objectFit: 'cover',
                    }}
                    width="100"
                  />
                  <Button variant="outline">Share on X</Button>
                  <Button variant="outline">Share on LinkedIn</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>TypeScript: Advanced Concepts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Views: 1500</p>
                  <img
                    alt="Graph for Tip 3"
                    className="object-cover"
                    height="50"
                    src="/placeholder.svg"
                    style={{
                      aspectRatio: '100/50',
                      objectFit: 'cover',
                    }}
                    width="100"
                  />
                  <Button variant="outline">Share on X</Button>
                  <Button variant="outline">Share on LinkedIn</Button>
                </CardContent>
              </Card>
            </div>
            <Link className="mt-2 underline" href="#">
              All Tips
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
