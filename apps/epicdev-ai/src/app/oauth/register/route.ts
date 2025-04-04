import { NextResponse } from 'next/server'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('ABCDEFGHIJKLMNOP', 6)
export async function POST() {
	return NextResponse.json(
		{
			client_id: nanoid(),
			client_secret: nanoid(),
		},
		{ status: 201 },
	)
}
