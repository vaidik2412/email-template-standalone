import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listInvoiceEmailTemplates } = vi.hoisted(() => ({
  listInvoiceEmailTemplates: vi.fn(),
}));

vi.mock('@/server/invoiceEmailDrawer/resolveDraft', () => ({
  listInvoiceEmailTemplates,
}));

import { GET } from '../route';

describe('prototype invoice drawer templates route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns invoice email template options', async () => {
    listInvoiceEmailTemplates.mockResolvedValue([
      {
        id: 'fallback-invoice-share',
        name: 'Share Invoice',
      },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: [
        {
          id: 'fallback-invoice-share',
          name: 'Share Invoice',
        },
      ],
    });
  });
});
