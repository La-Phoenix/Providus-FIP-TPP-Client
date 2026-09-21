import {
  PagedResult,
  Customer,
  OnboardCustomerRequest,
  OnboardCustomerResponse,
  Card,
  OptionItem,
  CardRequestPayload,
  FundCardPayload,
  LoadCardResponse,
  CardTransaction,
  FundingTransaction,
  AuditLog,
  FipRequest,
  DashboardSummary,
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const correlationId = 'nexapay-' + Math.random().toString(36).substring(2, 10);
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status} ${res.statusText}`;
    try {
      const errObj = await res.json();
      if (errObj.errors && typeof errObj.errors === 'object') {
        const fieldErrors = Object.entries(errObj.errors)
          .map(([field, msgs]) => {
            const msgList = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
            return `${field}: ${msgList}`;
          })
          .join(' | ');
        if (fieldErrors) {
          errorDetail = fieldErrors;
        } else if (errObj.detail) {
          errorDetail = errObj.detail;
        } else if (errObj.message) {
          errorDetail = errObj.message;
        } else if (errObj.title) {
          errorDetail = errObj.title;
        }
      } else if (errObj.detail) {
        errorDetail = errObj.detail;
      } else if (errObj.message) {
        errorDetail = errObj.message;
      } else if (errObj.title) {
        errorDetail = errObj.title;
      }
    } catch {
      // JSON parse fallback
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Dashboard
  getDashboardSummary: () =>
    fetchJson<DashboardSummary>(`${API_BASE}/dashboard/summary`),

  // Customers
  getCustomers: (params?: { search?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.pageSize) q.append('pageSize', params.pageSize.toString());
    return fetchJson<PagedResult<Customer>>(`${API_BASE}/customers?${q.toString()}`);
  },

  onboardCustomer: (payload: OnboardCustomerRequest) =>
    fetchJson<OnboardCustomerResponse>(`${API_BASE}/customers/onboard`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCustomerDetails: (customerId: string) =>
    fetchJson<import('../types').CustomerDetail>(`${API_BASE}/customers/${customerId}/details`),

  // Cards
  getCards: async (params?: { customerId?: string; maskedPan?: string; nameOnCard?: string }): Promise<Card[]> => {
    const q = new URLSearchParams();
    if (params?.customerId) q.append('customerId', params.customerId);
    if (params?.maskedPan) q.append('maskedPan', params.maskedPan);
    if (params?.nameOnCard) q.append('nameOnCard', params.nameOnCard);
    const result = await fetchJson<any>(`${API_BASE}/cards?${q.toString()}`);
    const rawList = Array.isArray(result) ? result : (result?.cards || []);
    return rawList.map((c: any) => ({
      id: c.localCardId || c.id || '',
      customerId: c.customerId || '',
      providusCardId: c.providusCardId || '',
      maskedPan: c.maskedPan || '',
      nameOnCard: c.nameOnCard || '',
      expiryDate: c.expiryDate || '',
      balance: c.balanceInKobo ?? c.balance ?? 0,
      status: c.status || 'Active',
      createdAt: c.createdAt || '',
      updatedAt: c.updatedAt || '',
    }));
  },

  getProfiles: () =>
    fetchJson<OptionItem[]>(`${API_BASE}/cards/options/profiles`),

  getCardProfiles: () =>
    fetchJson<OptionItem[]>(`${API_BASE}/cards/options/card-profiles`),

  requestCard: (payload: CardRequestPayload) =>
    fetchJson<{ providusCardId: string; status: string }>(`${API_BASE}/cards/request`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addCard: (payload: { customerId: string; cardId: string }) =>
    fetchJson<{ isSuccess: boolean; message: string; customerId: string; cardId: string }>(`${API_BASE}/cards/add`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  blockCard: (cardId: string, reason?: string) =>
    fetchJson<{ success: boolean; message: string }>(`${API_BASE}/cards/${cardId}/block`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Requested by customer' }),
    }),

  unblockCard: (cardId: string, reason?: string) =>
    fetchJson<{ success: boolean; message: string }>(`${API_BASE}/cards/${cardId}/unblock`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Customer request' }),
    }),

  setCardPin: (cardId: string, pin: string) =>
    fetchJson<{ success: boolean; message: string }>(`${API_BASE}/cards/${cardId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),

  fundCard: (cardId: string, payload: FundCardPayload) =>
    fetchJson<LoadCardResponse>(`${API_BASE}/cards/${cardId}/fund`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  unfundCard: (cardId: string, payload: FundCardPayload) =>
    fetchJson<LoadCardResponse>(`${API_BASE}/cards/${cardId}/unfund`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Transactions
  getCardTransactions: (params?: { cardId?: string; customerId?: string; fromDate?: string; toDate?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.cardId) q.append('cardId', params.cardId);
    if (params?.customerId) q.append('customerId', params.customerId);
    if (params?.fromDate) q.append('fromDate', params.fromDate);
    if (params?.toDate) q.append('toDate', params.toDate);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.pageSize) q.append('pageSize', params.pageSize.toString());
    return fetchJson<PagedResult<CardTransaction>>(`${API_BASE}/transactions/card?${q.toString()}`);
  },

  getFundingTransactions: (params?: { cardId?: string; customerId?: string; fromDate?: string; toDate?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.cardId) q.append('cardId', params.cardId);
    if (params?.customerId) q.append('customerId', params.customerId);
    if (params?.fromDate) q.append('fromDate', params.fromDate);
    if (params?.toDate) q.append('toDate', params.toDate);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.pageSize) q.append('pageSize', params.pageSize.toString());
    return fetchJson<PagedResult<FundingTransaction>>(`${API_BASE}/transactions/funding?${q.toString()}`);
  },

  // Audit Logs
  getAuditLogs: (params?: { search?: string; actor?: string; action?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.actor) q.append('actor', params.actor);
    if (params?.action) q.append('action', params.action);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.pageSize) q.append('pageSize', params.pageSize.toString());
    return fetchJson<PagedResult<AuditLog>>(`${API_BASE}/audit-logs?${q.toString()}`);
  },

  getFipRequests: (params?: { operation?: string; success?: boolean; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.operation) q.append('operation', params.operation);
    if (params?.success !== undefined) q.append('success', params.success.toString());
    if (params?.page) q.append('page', params.page.toString());
    if (params?.pageSize) q.append('pageSize', params.pageSize.toString());
    return fetchJson<PagedResult<FipRequest>>(`${API_BASE}/audit-logs/fip-requests?${q.toString()}`);
  },
};
