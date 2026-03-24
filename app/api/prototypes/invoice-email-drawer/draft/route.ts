import { resolveInvoiceEmailDrawerDraft } from '@/server/invoiceEmailDrawer/resolveDraft';

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

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (typeof payload.invoiceId !== 'string' || typeof payload.templateId !== 'string') {
      return Response.json(
        {
          message: 'invoiceId and templateId are required',
        },
        {
          status: 400,
        },
      );
    }

    const draft = await resolveInvoiceEmailDrawerDraft({
      invoiceId: payload.invoiceId,
      templateId: payload.templateId,
    });

    return Response.json(draft, {
      status: 200,
    });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
