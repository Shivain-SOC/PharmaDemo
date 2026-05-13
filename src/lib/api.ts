import { Medicine, Sale, Analytics } from '../types';

const API_BASE = '/api';

export const api = {
  async fetch(url: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Request failed');
    }
    return res.json();
  },

  auth: {
    login: (body: any) => api.fetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => api.fetch('/auth/logout', { method: 'POST' }),
  },

  inventory: {
    list: (): Promise<Medicine[]> => api.fetch('/medicines'),
    create: (body: any) => api.fetch('/medicines', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: any) => api.fetch(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: number) => api.fetch(`/medicines/${id}`, { method: 'DELETE' }),
  },

  billing: {
    createSale: (body: any) => api.fetch('/sales', { method: 'POST', body: JSON.stringify(body) }),
    listSales: (): Promise<Sale[]> => api.fetch('/sales'),
  },

  analytics: {
    get: (): Promise<Analytics> => api.fetch('/analytics'),
  }
};
