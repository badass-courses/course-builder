import Page, { type Props } from '../page'

export default async function LessonPage({ params }: Props) {
	return <Page params={params} isExercise={true} />
}
