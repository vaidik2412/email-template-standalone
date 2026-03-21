import { TemplateNotFoundError } from '@/server/templates/errors';
import { getTemplateById, updateTemplate } from '@/server/templates/service';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parsePublishIntent(request: Request) {
  const { searchParams } = new URL(request.url);
  return searchParams.get('isPublished') === 'true';
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const response = await getTemplateById(id);

    return Response.json(response, {
      status: 200,
    });
  } catch (error) {
    if (error instanceof TemplateNotFoundError) {
      return Response.json(
        {
          message: error.message,
        },
        {
          status: 404,
        },
      );
    }

    throw error;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const payload = await request.json();

  try {
    const response = await updateTemplate(id, payload, {
      isPublished: parsePublishIntent(request),
    });

    return Response.json(response, {
      status: 200,
    });
  } catch (error) {
    if (error instanceof TemplateNotFoundError) {
      return Response.json(
        {
          message: error.message,
        },
        {
          status: 404,
        },
      );
    }

    throw error;
  }
}
