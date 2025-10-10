import { NextResponse } from 'next/server'

export async function GET() {
	const config = {
		token_endpoint: `${process.env.NEXT_PUBLIC_URL}/oauth/token`,
		token_endpoint_auth_methods_supported: [],
		response_types_supported: ['token'],
		scopes_supported: ['content:read', 'progress'],
		issuer: `${process.env.NEXT_PUBLIC_URL}/oauth`,
		registration_endpoint: `${process.env.NEXT_PUBLIC_URL}/oauth/register`,
		device_authorization_endpoint: `${process.env.NEXT_PUBLIC_URL}/oauth/device/code`,
		claims_supported: ['email'],
		userinfo_endpoint: `${process.env.NEXT_PUBLIC_URL}/oauth/userinfo`,
	}

	return NextResponse.json(config)
}
