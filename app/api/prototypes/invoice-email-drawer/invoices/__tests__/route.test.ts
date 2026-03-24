import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listSampleInvoices } = vi.hoisted(() => ({
  listSampleInvoices: vi.fn(),
}));

vi.mock('@/server/invoiceEmailDrawer/invoices', () => ({
  listSampleInvoices,
}));

import { GET } from '../route';

describe('prototype invoice drawer invoices route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns recent sample invoices', async () => {
    listSampleInvoices.mockResolvedValue([
      {
        id: 'invoice-1',
        number: 'INV-001',
      },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: [
        {
          id: 'invoice-1',
          number: 'INV-001',
        },
      ],
    });
  });
});
