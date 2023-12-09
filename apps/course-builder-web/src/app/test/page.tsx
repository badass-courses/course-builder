/**
 * v0 by Vercel.
 *
 * @see https://v0.dev/t/kjDAPmzUC6C
 */
import Link from 'next/link'
import {
  CardTitle,
  CardHeader,
  CardContent,
  Card,
  CardFooter,
} from '@coursebuilder/ui'
import {Button} from '@coursebuilder/ui'
import Image from 'next/image'

export default function Component() {
  return (
    <div key="1" className="flex min-h-screen w-full flex-col">
      <header className="flex h-16 shrink-0 items-center border-b px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
            href="#"
          >
            <svg
              className=" h-6 w-6"
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
              <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
              <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
              <path d="M12 3v6" />
            </svg>
            <span className="sr-only">CMS Dashboard</span>
          </Link>
          <Link className="font-bold" href="#">
            Dashboard
          </Link>
          <Link className="text-zinc-500 dark:text-zinc-400" href="#">
            Modules
          </Link>
          <Link className="text-zinc-500 dark:text-zinc-400" href="#">
            Tips
          </Link>
          <Link className="text-zinc-500 dark:text-zinc-400" href="#">
            Media Resources
          </Link>
          <Link className="text-zinc-500 dark:text-zinc-400" href="#">
            Articles
          </Link>
        </nav>
      </header>
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-row gap-4 p-4 md:gap-8 md:p-10">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Create a Tip
              </CardTitle>
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
              <div className="text-lg font-bold">
                Enter your tip summary here
              </div>
              <p className="mt-2 text-sm">
                Your summary will be used to generate the title and draft body
                text based on the transcript of the video.
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
                      <Image
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
                      <Image
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Most Recent Unpublished Module
              </CardTitle>
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
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                Building: Introduction to JSX
                <Button className="ml-2 h-6 w-6" variant="ghost">
                  <svg
                    className=" h-4 w-4"
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
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 16h5v5" />
                  </svg>
                </Button>
              </div>
              <div className="mt-2 flex flex-col gap-2">
                <Button size="lg">Create New Lesson or Module Resource</Button>
                <Button size="lg" variant="outline">
                  <svg
                    className=" mr-2 h-4 w-4"
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
                    <rect height="18" rx="2" width="18" x="3" y="3" />
                    <path d="M7 3v18" />
                    <path d="M3 7.5h4" />
                    <path d="M3 12h18" />
                    <path d="M3 16.5h4" />
                    <path d="M17 3v18" />
                    <path d="M17 7.5h4" />
                    <path d="M17 16.5h4" />
                  </svg>
                  Add New Media Resource
                </Button>
              </div>
              <div className="mt-2 border-t pt-2">
                <h2 className="text-lg font-bold">Module Resources</h2>
                <ul>
                  <li>
                    <Link className="underline" href="#">
                      Lesson 1: What is JSX?
                    </Link>
                  </li>
                  <li>
                    <Link className="underline" href="#">
                      Lesson 2: Embedding Expressions in JSX
                    </Link>
                  </li>
                  <li>
                    <Link className="underline" href="#">
                      Lesson 3: JSX is an Expression Too
                    </Link>
                  </li>
                  <li>
                    <Link className="underline" href="#">
                      Lesson 4: Specifying Attributes with JSX
                    </Link>
                  </li>
                  <li>
                    <Link className="underline" href="#">
                      Lesson 5: Specifying Children with JSX
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-2 border-t pt-2">
                <h2 className="text-lg font-bold">Next Steps</h2>
                <ul className="list-inside list-disc">
                  <li>Review and finalize the module summary</li>
                  <li>Add all necessary module resources</li>
                  <li>Review and finalize all lessons</li>
                  <li>Submit for review and publishing</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <div className="mt-4 border-t pt-2">
                <h2 className="text-lg font-bold">Other Modules</h2>
                <div className="mt-2 flex w-full flex-col space-y-4">
                  <Card className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                        TypeScript: The Basics - An Introduction to TypeScript
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-700 dark:text-gray-300">
                      Published
                      <Button
                        className="mt-2 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                        variant="outline"
                      >
                        View
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                        TypeScript: Advanced Concepts - Deep Dive into
                        TypeScript
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-700 dark:text-gray-300">
                      Unpublished
                      <Button
                        className="mt-2 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                        variant="outline"
                      >
                        Edit
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                        TypeScript: Expert Techniques - Mastering TypeScript
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-700 dark:text-gray-300">
                      Published
                      <Button
                        className="mt-2 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                        variant="outline"
                      >
                        View
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                <h2 className="mt-4 text-lg font-bold">
                  Next Steps for Module Creation and Review
                </h2>
                <div className="mt-2 flex flex-col gap-2">
                  <Button variant="default">Create New Module</Button>
                  <Button variant="outline">Review Unpublished Modules</Button>
                </div>
                <Link className="mt-2 underline" href="#">
                  All Modules
                </Link>
              </div>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Add Media Resources
              </CardTitle>
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
                <rect height="18" rx="2" width="18" x="3" y="3" />
                <path d="M7 3v18" />
                <path d="M3 7.5h4" />
                <path d="M3 12h18" />
                <path d="M3 16.5h4" />
                <path d="M17 3v18" />
                <path d="M17 7.5h4" />
                <path d="M17 16.5h4" />
              </svg>
            </CardHeader>
            <CardContent>
              <section className="mt-4 rounded-md border-2 border-dashed border-gray-500 p-4 text-center dark:border-gray-400">
                <h2 className="text-lg font-bold">Upload Media</h2>
                <p className="mb-2">Drag and drop your media files here</p>
                <p>or</p>
                <input
                  aria-label="Upload your media files here"
                  className="mt-2 h-20 w-full rounded-md border p-2"
                  type="file"
                />
              </section>
              <section className="mt-4">
                <h2 className="text-lg font-bold">
                  Recently Added Media Resources
                </h2>
                <div className="mt-2 grid grid-cols-3 gap-4">
                  <div className="font-bold">Filename</div>
                  <div className="font-bold">Status</div>
                  <div className="font-bold">Transcription</div>
                  <div>media1.mp4</div>
                  <div>Processing</div>
                  <div>
                    <svg
                      className=" h-4 w-4 text-green-500"
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
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>media2.mp4</div>
                  <div>Ready</div>
                  <div>
                    <svg
                      className=" h-4 w-4 text-green-500"
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
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>media3.mp4</div>
                  <div>In Use</div>
                  <div>
                    <svg
                      className=" h-4 w-4 text-red-500"
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
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </div>
                </div>
                <Link className="mt-2 underline" href="#">
                  All Media Resources
                </Link>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
