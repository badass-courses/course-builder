import SrtParser2 from 'srt-parser-2'

export async function mergeSrtWithScreenshots(
	srt: string,
	muxPlaybackId: string,
) {
	let parser = new SrtParser2()
	let result = parser.fromSrt(srt)

	// filter over result to find triggerWords
	let timesWithWords = result.filter((x) => {
		for (let word of triggerWords) {
			if (x.text.toLowerCase().includes(word)) {
				return true
			}
		}
		return false
	})

	let timesWithWordsScreenshots: any = []
	let screenshotNumber = 1
	for (let time of timesWithWords) {
		try {
			const startTime = time.startTime.split(',')[0]
			const [hours, minutes, seconds]: any = startTime?.split(':').map(Number)
			const totalSeconds = hours * 3600 + minutes * 60 + seconds

			const muxThumbnailUrl = `https://image.mux.com/${muxPlaybackId}/thumbnail.png?width=800&height=600`
			timesWithWordsScreenshots.push({
				...time,
				screenshot: muxThumbnailUrl + `&time=${totalSeconds}`,
			})
		} catch (e) {
			console.log(e)
		}
		screenshotNumber++
	}
	// deep merge timesWithWordsScreenshots with result
	let resultWithScreenshots = result.map((x: any) => {
		let found = timesWithWordsScreenshots.find(
			(y: any) => y.startTime === x.startTime,
		)
		if (found) {
			return { ...x, screenshot: found.screenshot }
		}
		return x
	})

	let withTimes = resultWithScreenshots.map((line) => {
		return { ...line, totalSeconds: line.endSeconds - line.startSeconds }
	})

	let timeLimitInSeconds = 20
	let currentTimeInSeconds = 0
	let transcribedSentencesCount = 0

	let arrayByTimes = []
	let tempArray: any = []
	withTimes.forEach((x, i) => {
		if (currentTimeInSeconds + x.totalSeconds >= timeLimitInSeconds) {
			arrayByTimes.push(tempArray)
			tempArray = []
			currentTimeInSeconds = 0
			transcribedSentencesCount = 0
		}

		if (currentTimeInSeconds === 0) {
			// if x has a screenshot add it to the array
			if (x.screenshot) {
				tempArray.push(
					`[${formatMdTimeString(x.startTime.split(',')[0])}] ${x.text}\n\n![](${x.screenshot})\n\n`,
				)
			} else {
				tempArray.push(
					`[${formatMdTimeString(x.startTime.split(',')[0])}] ${x.text}`,
				)
			}
		} else {
			if (x.screenshot) {
				tempArray.push(`${x.text}\n\n![](${x.screenshot})\n\n`)
			} else {
				tempArray.push(`${x.text}`)
			}
		}
		currentTimeInSeconds += x.totalSeconds
		transcribedSentencesCount++
	})

	arrayByTimes.push(tempArray)

	let transcript = [
		...arrayByTimes
			.map((x) => x.join(' '))
			.flat()
			.join('\n\n'),
	].join('')
	return { transcriptWithScreenshots: transcript, resultWithScreenshots }
}

function formatMdTimeString(str: string) {
	let [h, m, s] = str.split(':')
	if (h == '00') {
		return `${m}:${s}`
	}

	return `${h}:${m}:${s}`
}

let triggerWords = [
	'here',
	'have',
	'there',
	'this',
	'that',
	'see',
	'these',
	'look',
	'show',
	'watch',
	'notice',
	'line',
	'where',
	'say',
	'go',
	'do',
	'can',
	'hover',
	'click',
	'function',
	'component',
	'variable',
]
