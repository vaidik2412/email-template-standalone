import { generateTemplate, type GenerateTemplateInput } from '@/server/ai/generateTemplate';

const KNOWN_ERROR_PREFIXES = [
  'This doesn\'t look like',
  'Could not generate',
  'APP_OPENAI_API_KEY is required',
];

function jsonErrorResponse(error: unknown) {
  const raw = error instanceof Error ? error.message : '';
  const isKnownError = KNOWN_ERROR_PREFIXES.some((prefix) => raw.startsWith(prefix));

  console.error('[generate-template] Error:', raw);

  const message = isKnownError
    ? raw
    : 'Something went wrong while generating the template. Please try again.';

  return Response.json({ message }, { status: isKnownError ? 400 : 500 });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateTemplateInput;

    if (!body.description?.trim()) {
      return Response.json({ message: 'Description is required' }, { status: 400 });
    }

    const result = await generateTemplate({
      description: body.description.trim(),
    });

    return Response.json(result, { status: 200 });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
