import { listInvoiceEmailTemplates } from '@/server/invoiceEmailDrawer/resolveDraft';

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
    const templates = await listInvoiceEmailTemplates();

    return Response.json(
      {
        data: templates,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
