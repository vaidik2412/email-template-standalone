import { createTemplate, listTemplates } from '@/server/templates/service';

function parsePublishIntent(request: Request) {
  const { searchParams } = new URL(request.url);
  return searchParams.get('isPublished') === 'true';
}

export async function GET() {
  const response = await listTemplates();

  return Response.json(response, {
    status: 200,
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const response = await createTemplate(payload, {
    isPublished: parsePublishIntent(request),
  });

  return Response.json(response, {
    status: 201,
  });
}
