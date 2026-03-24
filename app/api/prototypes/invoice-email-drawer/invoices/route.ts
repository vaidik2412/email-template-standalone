import { listSampleInvoices } from '@/server/invoiceEmailDrawer/invoices';

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
    const invoices = await listSampleInvoices();

    return Response.json(
      {
        data: invoices,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
