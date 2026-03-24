import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';

import { FIXED_APP_CONTEXT } from '../../constants/fixedContext';

const { connectToDatabase } = vi.hoisted(() => ({
  connectToDatabase: vi.fn(),
}));

vi.mock('../../db', () => ({
  connectToDatabase,
}));

import { listSampleInvoices } from '../invoices';

function mockInvoiceCollection(rawInvoices: Record<string, unknown>[]) {
  const toArray = vi.fn().mockResolvedValue(rawInvoices);
  const limit = vi.fn().mockReturnValue({ toArray });
  const sort = vi.fn().mockReturnValue({ limit });
  const find = vi.fn().mockReturnValue({ sort });
  const collection = vi.fn().mockReturnValue({ find });

  connectToDatabase.mockResolvedValue({
    connection: {
      db: {
        collection,
      },
    },
  });

  return { collection, find, sort, limit, toArray };
}

describe('invoice email drawer invoice helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists recent invoices for the fixed demo business and normalizes drawer summaries', async () => {
    const rawInvoices = [
      {
        _id: new Types.ObjectId('66ef0bf7bb00000000000111'),
        business: new Types.ObjectId(FIXED_APP_CONTEXT.business.id),
        invoiceNumber: 'INV-2026-001',
        billedTo: {
          name: 'Aarav Industries',
          email: 'accounts@aaravindustries.in',
        },
        invoiceDate: new Date('2026-03-22T00:00:00.000Z'),
        dueDate: new Date('2026-04-06T00:00:00.000Z'),
        total: 12500,
        currency: 'INR',
        status: 'UNPAID',
      },
    ];

    const { collection, find, sort, limit } = mockInvoiceCollection(rawInvoices);

    await expect(listSampleInvoices()).resolves.toEqual([
      {
        id: '66ef0bf7bb00000000000111',
        number: 'INV-2026-001',
        customerName: 'Aarav Industries',
        customerEmail: 'accounts@aaravindustries.in',
        issueDate: '22 Mar 2026',
        dueDate: '06 Apr 2026',
        currency: 'INR',
        total: '12,500.00',
        status: 'UNPAID',
      },
    ]);

    expect(collection).toHaveBeenCalledWith('invoices');
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        business: expect.any(Types.ObjectId),
      }),
      expect.any(Object),
    );
    expect(sort).toHaveBeenCalledWith({
      updatedAt: -1,
      createdAt: -1,
    });
    expect(limit).toHaveBeenCalledWith(20);
  });

  it('falls back safely when invoice fields are partially missing', async () => {
    mockInvoiceCollection([
      {
        _id: new Types.ObjectId('66ef0bf7bb00000000000112'),
        number: 'INV-FALLBACK-1',
        customerName: 'Fallback Customer',
        amount: 0,
        createdAt: new Date('2026-03-20T00:00:00.000Z'),
      },
    ]);

    await expect(listSampleInvoices()).resolves.toEqual([
      {
        id: '66ef0bf7bb00000000000112',
        number: 'INV-FALLBACK-1',
        customerName: 'Fallback Customer',
        customerEmail: '',
        issueDate: '20 Mar 2026',
        dueDate: '',
        currency: 'INR',
        total: '0.00',
        status: 'UNKNOWN',
      },
    ]);
  });
});
