import type {
  AppNotification,
  AuthResponse,
  Booking,
  ControlMode,
  ControlSession,
  FeedbackTicket,
  Order,
  OrderStatus,
  RechargeOffer,
  RechargeRecord,
  Station,
  UserBundle,
  WashPackage,
} from '../types/app';

const TOKEN_KEY = 'zhijing.auth.token';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

export const getStoredToken = () => window.localStorage.getItem(TOKEN_KEY);

export const setStoredToken = (token: string | null) => {
  if (!token) {
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, token);
};

const request = async <T>(path: string, options: RequestOptions = {}) => {
  const headers = new Headers();
  const token = options.token ?? getStoredToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || '请求失败，请稍后再试。');
  }

  return payload.data;
};

export const api = {
  health: () => request<{ configured: boolean; missingConfig: string[] }>('/api/health'),
  sendCode: (body: { target: string; scene: 'register' | 'reset_password'; method: 'phone' | 'email' }) =>
    request<{ expiresAt: string; debugCode: string }>('/api/auth/send-code', {
      method: 'POST',
      body,
    }),
  login: (body: { account: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body }),
  register: (body: {
    username: string;
    phone: string;
    email?: string;
    password: string;
    confirmPassword: string;
    displayName?: string;
    agreementAccepted: boolean;
    verificationCode: string;
  }) => request<AuthResponse>('/api/auth/register', { method: 'POST', body }),
  resetPassword: (body: {
    target: string;
    method: 'phone' | 'email';
    verificationCode: string;
    newPassword: string;
  }) => request<null>('/api/auth/reset-password', { method: 'POST', body }),
  getSession: () => request<UserBundle>('/api/auth/session'),
  getDashboard: () =>
    request<{
      user: UserBundle['user'];
      membership: UserBundle['membership'];
      stations: Station[];
      notifications: AppNotification[];
      controlSession: ControlSession | null;
      orders: Order[];
      bookings: Booking[];
    }>('/api/app/dashboard'),
  getProfile: () => request<UserBundle>('/api/users/me'),
  updateProfile: (body: { displayName?: string; avatar?: string; city?: string; district?: string }) =>
    request<{ user: UserBundle['user'] }>('/api/users/me', { method: 'PATCH', body }),
  getMembership: () => request<UserBundle['membership']>('/api/membership'),
  getStations: (params?: { city?: string; district?: string }) => {
    const search = new URLSearchParams();
    if (params?.city) search.set('city', params.city);
    if (params?.district) search.set('district', params.district);
    return request<Station[]>(`/api/stations${search.toString() ? `?${search}` : ''}`);
  },
  getPackages: () => request<WashPackage[]>('/api/packages'),
  purchasePackage: (packageId: string) =>
    request<{ package: WashPackage; user: UserBundle['user'] }>('/api/packages/purchase', {
      method: 'POST',
      body: { packageId },
    }),
  getRechargeOffers: () => request<RechargeOffer[]>('/api/recharges/offers'),
  getRechargeHistory: () => request<RechargeRecord[]>('/api/recharges/history'),
  createRecharge: (amount: number) =>
    request<{ balance: number; offer: RechargeOffer | null }>('/api/recharges', {
      method: 'POST',
      body: { amount },
    }),
  getBookings: () => request<Booking[]>('/api/bookings'),
  createBooking: (body: { stationId: string; scheduledAt: string; deviceId?: string }) =>
    request<Booking>('/api/bookings', {
      method: 'POST',
      body,
    }),
  getOrders: (status?: OrderStatus | 'all') => {
    const search = new URLSearchParams();
    if (status && status !== 'all') {
      search.set('status', status);
    }
    return request<Order[]>(`/api/orders${search.toString() ? `?${search}` : ''}`);
  },
  getNotifications: () => request<AppNotification[]>('/api/notifications'),
  getFeedbackTickets: () => request<FeedbackTicket[]>('/api/feedback'),
  createFeedback: (body: { type: string; description: string; phone: string; attachments: string[] }) =>
    request<FeedbackTicket>('/api/feedback', {
      method: 'POST',
      body,
    }),
  getControlSession: () => request<ControlSession | null>('/api/control/session'),
  startControlSession: (stationId?: string) =>
    request<ControlSession>('/api/control/start', {
      method: 'POST',
      body: { stationId },
    }),
  updateControlMode: (mode: ControlMode) =>
    request<ControlSession | null>('/api/control/mode', {
      method: 'POST',
      body: { mode },
    }),
  pauseControlSession: () =>
    request<ControlSession | null>('/api/control/pause', { method: 'POST' }),
  resumeControlSession: () =>
    request<ControlSession | null>('/api/control/resume', { method: 'POST' }),
  tickControlSession: () =>
    request<ControlSession | null>('/api/control/tick', { method: 'POST' }),
  checkoutControlSession: () =>
    request<Order>('/api/control/checkout', { method: 'POST' }),
};
