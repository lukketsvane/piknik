import { env } from '$env/dynamic/private'
import { GoogleGenerativeAI } from '@google/generative-ai'

type AIProvider = 'openai' | 'gemini'

type GenerateTextOptions = {
	prompt: string
	imageDataUrl?: string
}

const DEFAULT_OPENAI_MODEL = 'gpt-5-mini'
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash'

function resolveProvider(): AIProvider {
	const preferredProvider = env.AI_PROVIDER?.toLowerCase()

	if (preferredProvider === 'gemini' && env.GEMINI_API_KEY) {
		return 'gemini'
	}

	if ((preferredProvider === 'openai' || !preferredProvider) && env.OPENAI_API_KEY) {
		return 'openai'
	}

	if (env.GEMINI_API_KEY) {
		return 'gemini'
	}

	if (env.OPENAI_API_KEY) {
		return 'openai'
	}

	throw new Error('Missing AI credentials. Set OPENAI_API_KEY or GEMINI_API_KEY.')
}

function getImagePayload(imageDataUrl: string) {
	const [, mimeType = 'image/jpeg', data = ''] =
		imageDataUrl.match(/^data:(image\/[-+.\w]+);base64,(.*)$/) ?? []

	return { mimeType, data }
}

async function generateWithOpenAI({ prompt, imageDataUrl }: GenerateTextOptions) {
	if (!env.OPENAI_API_KEY) {
		throw new Error('OPENAI_API_KEY is not configured')
	}

	if (!/\bjson\b/i.test(prompt)) {
		throw new Error('OpenAI JSON mode requires the prompt to request JSON output')
	}

	const content = imageDataUrl
		? [
				{ type: 'text', text: prompt },
				{ type: 'image_url', image_url: { url: imageDataUrl } }
			]
		: prompt

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.OPENAI_API_KEY}`
		},
		body: JSON.stringify({
			model: env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
			messages: [{ role: 'user', content }],
			response_format: { type: 'json_object' }
		})
	})

	if (!response.ok) {
		throw new Error(`OpenAI API error (${response.status}): ${await response.text()}`)
	}

	const data = await response.json()
	const text = data.choices?.[0]?.message?.content

	if (typeof text !== 'string' || !text.trim()) {
		throw new Error('OpenAI returned an empty response')
	}

	return text
}

async function generateWithGemini({ prompt, imageDataUrl }: GenerateTextOptions) {
	if (!env.GEMINI_API_KEY) {
		throw new Error('GEMINI_API_KEY is not configured')
	}

	const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
	const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL })

	const result = await model.generateContent(
		imageDataUrl
			? [
					prompt,
					{
						inlineData: getImagePayload(imageDataUrl)
					}
				]
			: prompt
	)

	return result.response.text()
}

export async function generateAIText(options: GenerateTextOptions) {
	const provider = resolveProvider()

	return provider === 'openai' ? generateWithOpenAI(options) : generateWithGemini(options)
}
