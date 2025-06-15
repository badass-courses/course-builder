import { z } from 'zod'

export const WordSchema = z.object({
	word: z.string(),
	start: z.number(),
	end: z.number(),
	confidence: z.number(),
	punctuated_word: z.string(),
})

export const SentenceSchema = z.object({
	text: z.string(),
	start: z.number(),
	end: z.number(),
})

export const ParagraphSchema = z
	.object({
		text: z.string().optional(),
		sentences: z.array(SentenceSchema),
	})
	.transform(
		(data): { text: string; sentences: z.infer<typeof SentenceSchema>[] } => ({
			...data,
			text: data.text ?? data.sentences.map((s) => s.text).join(' '),
		}),
	)

export const AlternativeSchema = z.object({
	transcript: z.string(),
	words: z.array(WordSchema),
	confidence: z.number().optional(),
	paragraphs: z
		.object({
			paragraphs: z.array(ParagraphSchema),
		})
		.optional(),
})

export const ChannelSchema = z.object({
	alternatives: z.array(AlternativeSchema),
})

export const UtteranceSchema = z.object({
	id: z.string(),
	start: z.number(),
	end: z.number(),
	confidence: z.number(),
	channel: z.number(),
	transcript: z.string(),
	words: z.array(WordSchema),
})

export const DeepgramResultsSchema = z.object({
	channels: z.array(ChannelSchema),
	utterances: z.array(UtteranceSchema).optional(),
})

export const DeepgramResponseSchema = z.object({
	deepgramResults: DeepgramResultsSchema,
})

export type Word = z.infer<typeof WordSchema>
export type Sentence = z.infer<typeof SentenceSchema>
export type Paragraph = z.infer<typeof ParagraphSchema>
export type Alternative = z.infer<typeof AlternativeSchema>
export type Channel = z.infer<typeof ChannelSchema>
export type Utterance = z.infer<typeof UtteranceSchema>
export type DeepgramResults = z.infer<typeof DeepgramResultsSchema>
export type DeepgramResponse = z.infer<typeof DeepgramResponseSchema>
