import OpenAI from 'openai'

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

export async function determineSplitPoints(transcript: string) {
	const prompt = `The following transcript was extracted from a tutorial video. Please generate a high-level set of subsections from the transcript so that we can break it down into several sequential videos instead of a single long video.
    
    I'd like you to return a JSON object representing report with metadata and an array of subsections using the following JSON schema. 
    
    {
        "proposed_concepts": ["concept1", "concept2", "concept3"],
        "subsections" :[
            {
                "start": 0,
                "end": 100,
                "title": "Introduction",
                "key_points": [
                    "What is X",
                    "Why X is important"
                ]
            },
            {
                "start": 101,
                "end": 200,
                "title": "How to X",
                "key_points": [
                    "Step 1",
                    "Step 2",
                    "Step 3"
                ]
            },
            {
                "start": 201,
                "end": 258,
                "title": "How to Y",
                "key_points": [
                    "Step 1",
                    "Step 2"
                ]
            }
        ]
    }

    The 'proposed_concepts' field should seek to identify normalized short names of the concepts that this video gets into.

    These concepts will be compared against an existing list of concepts to identify overlaps, and the user will ultimately determine the terms to use - so be ambitious in identifying what's there, but try to use terms that would be schelling points that other iterations of this query would also arrive at.
    
    Your subsections should be sequential with minimal overlap, and the start and end times should be in seconds. Key points should be mindful to include nuanced points that the speaker was trying to make, in addition to simple bullets. 
    
    Each section will be passed independently into a separate call to create a detailed summary, and the sections will be joined together at the end to produce a coherent long-form summary of the entire video.

    Please return the JSON object and nothing else - no commentary or anything that is not part of the JSON report.

    The transcript is as follows:
---
    ${transcript}
    `
}
