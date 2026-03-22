import { TemplateNotFoundError } from '@/server/templates/errors';
import { getTemplateById, updateTemplate } from '@/server/templates/service';

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

    return jsonErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const payload = await request.json();
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

    return jsonErrorResponse(error);
  }
}
