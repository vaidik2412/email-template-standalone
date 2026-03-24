import { Types } from 'mongoose';

import { FIXED_APP_CONTEXT } from '../constants/fixedContext';
import { connectToDatabase } from '../db';
import type {
  InvoiceEmailDrawerInvoiceDetails,
  InvoiceEmailDrawerSampleInvoice,
} from './types';

const INVOICE_COLLECTION_NAME = 'invoices';
const DEFAULT_LIMIT = 20;

const SAMPLE_INVOICE_PROJECTION = {
  _id: 1,
  billType: 1,
  status: 1,
  invoiceNumber: 1,
  number: 1,
  expenseNumber: 1,
  invoiceDate: 1,
  dueDate: 1,
  total: 1,
  amount: 1,
  toPay: 1,
  amountPaid: 1,
  currency: 1,
  billedTo: 1,
  billedBy: 1,
  customer: 1,
  customerName: 1,
  customerEmail: 1,
  client: 1,
  shareLink: 1,
  publicLink: 1,
  docLink: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

type RawInvoice = {
  _id?: Types.ObjectId | string;
  billType?: unknown;
  status?: unknown;
  invoiceNumber?: unknown;
  number?: unknown;
  expenseNumber?: unknown;
  invoiceDate?: unknown;
  dueDate?: unknown;
  total?: unknown;
  amount?: unknown;
  toPay?: unknown;
  amountPaid?: unknown;
  currency?: unknown;
  billedTo?: {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
  } | null;
  billedBy?: {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
  } | null;
  customer?: {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
  } | null;
  customerName?: unknown;
  customerEmail?: unknown;
  shareLink?: unknown;
  publicLink?: unknown;
  docLink?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function coerceString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function coerceNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function formatCurrencyAmount(value: unknown) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(coerceNumber(value));
}

function formatDate(value: unknown) {
  const date = value instanceof Date ? value : typeof value === 'string' ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function normalizeInvoiceId(value: RawInvoice['_id']) {
  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  return coerceString(value);
}

function getInvoiceNumber(invoice: RawInvoice) {
  return (
    coerceString(invoice.invoiceNumber) ||
    coerceString(invoice.number) ||
    coerceString(invoice.expenseNumber) ||
    'Untitled Document'
  );
}

function getCustomerName(invoice: RawInvoice) {
  return (
    coerceString(invoice.billedTo?.name) ||
    coerceString(invoice.customer?.name) ||
    coerceString(invoice.customerName) ||
    'Unknown Customer'
  );
}

function getCustomerEmail(invoice: RawInvoice) {
  return (
    coerceString(invoice.billedTo?.email) ||
    coerceString(invoice.customer?.email) ||
    coerceString(invoice.customerEmail)
  );
}

function getBusinessName(invoice: RawInvoice) {
  return coerceString(invoice.billedBy?.name) || FIXED_APP_CONTEXT.business.name;
}

function getBusinessEmail(invoice: RawInvoice) {
  return coerceString(invoice.billedBy?.email) || FIXED_APP_CONTEXT.user.email;
}

function getBusinessPhone(invoice: RawInvoice) {
  return coerceString(invoice.billedBy?.phone);
}

function getInvoiceTotal(invoice: RawInvoice) {
  return formatCurrencyAmount(invoice.total ?? invoice.amount ?? invoice.toPay);
}

function getAmountPaid(invoice: RawInvoice) {
  return formatCurrencyAmount(invoice.amountPaid);
}

function getAmountDue(invoice: RawInvoice) {
  const total = coerceNumber(invoice.total ?? invoice.amount ?? invoice.toPay);
  const amountPaid = coerceNumber(invoice.amountPaid);

  if (!total && typeof invoice.toPay !== 'undefined') {
    return formatCurrencyAmount(invoice.toPay);
  }

  return formatCurrencyAmount(Math.max(total - amountPaid, 0));
}

function toSampleInvoice(invoice: RawInvoice): InvoiceEmailDrawerSampleInvoice {
  return {
    id: normalizeInvoiceId(invoice._id),
    number: getInvoiceNumber(invoice),
    customerName: getCustomerName(invoice),
    customerEmail: getCustomerEmail(invoice),
    issueDate: formatDate(invoice.invoiceDate ?? invoice.createdAt),
    dueDate: formatDate(invoice.dueDate),
    currency: coerceString(invoice.currency) || 'INR',
    total: getInvoiceTotal(invoice),
    status: coerceString(invoice.status) || 'UNKNOWN',
  };
}

function toInvoiceDetails(invoice: RawInvoice): InvoiceEmailDrawerInvoiceDetails {
  return {
    id: normalizeInvoiceId(invoice._id),
    billType: coerceString(invoice.billType) || 'INVOICE',
    number: getInvoiceNumber(invoice),
    customerName: getCustomerName(invoice),
    customerEmail: getCustomerEmail(invoice),
    customerPhone: coerceString(invoice.billedTo?.phone) || coerceString(invoice.customer?.phone),
    businessName: getBusinessName(invoice),
    businessEmail: getBusinessEmail(invoice),
    businessPhone: getBusinessPhone(invoice),
    issueDate: formatDate(invoice.invoiceDate ?? invoice.createdAt),
    dueDate: formatDate(invoice.dueDate),
    currency: coerceString(invoice.currency) || 'INR',
    total: getInvoiceTotal(invoice),
    amountPaid: getAmountPaid(invoice),
    amountDue: getAmountDue(invoice),
    shareLink:
      coerceString(invoice.shareLink) ||
      coerceString(invoice.publicLink) ||
      coerceString(invoice.docLink),
    status: coerceString(invoice.status) || 'UNKNOWN',
  };
}

async function findInvoices(query: Record<string, unknown>, limit: number) {
  const connection = await connectToDatabase();
  const collection = connection.connection.db.collection(INVOICE_COLLECTION_NAME);

  return collection
    .find(query, {
      projection: SAMPLE_INVOICE_PROJECTION,
    })
    .sort({
      updatedAt: -1,
      createdAt: -1,
    })
    .limit(limit)
    .toArray() as Promise<RawInvoice[]>;
}

export async function listSampleInvoices(limit = DEFAULT_LIMIT): Promise<InvoiceEmailDrawerSampleInvoice[]> {
  const scopedInvoices = await findInvoices(
    {
      business: new Types.ObjectId(FIXED_APP_CONTEXT.business.id),
      billType: 'INVOICE',
    },
    limit,
  );

  const invoices =
    scopedInvoices.length > 0 ? scopedInvoices : await findInvoices({ billType: 'INVOICE' }, limit);

  return invoices.map(toSampleInvoice);
}

export async function getSampleInvoiceById(invoiceId: string) {
  const invoices = await findInvoices(
    {
      _id: new Types.ObjectId(invoiceId),
    },
    1,
  );

  const invoice = invoices[0];

  if (!invoice) {
    return null;
  }

  return toInvoiceDetails(invoice);
}
