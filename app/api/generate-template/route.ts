import { generateTemplate, type GenerateTemplateInput } from '@/server/ai/generateTemplate';

function jsonErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Something went wrong';

  return Response.json({ message }, { status: 500 });
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
