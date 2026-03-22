import { createTemplate, listTemplates } from '@/server/templates/service';

function parsePublishIntent(request: Request) {
  const { searchParams } = new URL(request.url);
  return searchParams.get('isPublished') === 'true';
}

function jsonErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Something went wrong';
  const status =
    typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
      ? error.status
      : 500;

  return Response.json(
    {
      message,
    },
    {
      status,
    },
  );
}

export async function GET() {
  try {
    const response = await listTemplates();

    return Response.json(response, {
      status: 200,
    });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const response = await createTemplate(payload, {
      isPublished: parsePublishIntent(request),
    });

    return Response.json(response, {
      status: 201,
    });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
