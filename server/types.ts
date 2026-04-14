export type MembershipTier = 'silver' | 'gold' | 'platinum';
export type DeviceStatus = 'idle' | 'reserved' | 'busy' | 'maintenance' | 'offline';
export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type BookingStatus = 'upcoming' | 'checked_in' | 'completed' | 'cancelled';
export type PackageKind = 'wash_card' | 'time_card';
export type RechargeOfferKind = 'fixed' | 'custom';
export type NotificationType = 'system' | 'promotion' | 'order';
export type FeedbackStatus = 'submitted' | 'processing' | 'resolved';
export type ControlMode = 'water' | 'foam' | 'vacuum' | 'handwash';
export type VerificationScene = 'register' | 'reset_password';
export type VerificationMethod = 'phone' | 'email';

export interface User {
  id: string;
  username: string;
  phone: string;
  email: string | null;
  displayName: string;
  avatar: string;
  city: string;
  district: string;
  memberSince: string;
  walletBalance: number;
  washCredits: number;
  agreementAccepted: boolean;
  defaultStationId: string | null;
  timeCardExpiresAt: string | null;
}

export interface MembershipBenefit {
  id: string;
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
}

export interface Membership {
  userId: string;
  tier: MembershipTier;
  label: string;
  growthValue: number;
  nextTierGrowthValue: number;
  benefits: MembershipBenefit[];
}

export interface Station {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  tags: string[];
  availableDevices: number;
  totalDevices: number;
}

export interface Device {
  id: string;
  stationId: string;
  code: string;
  name: string;
  status: DeviceStatus;
  currentOrderId: string | null;
}

export interface WashPackage {
  id: string;
  kind: PackageKind;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number | null;
  credits: number | null;
  durationDays: number | null;
  highlight: string | null;
}

export interface RechargeOffer {
  id: string;
  kind: RechargeOfferKind;
  amount: number;
  bonus: number;
  label: string;
  highlighted: boolean;
}

export interface RechargeRecord {
  id: string;
  userId: string;
  amount: number;
  bonus: number;
  finalAmount: number;
  createdAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  stationId: string;
  stationName: string;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  scheduledAt: string;
  status: BookingStatus;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  stationId: string;
  stationName: string;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  status: OrderStatus;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  amount: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface FeedbackAttachment {
  id: string;
  feedbackId: string;
  name: string;
  mimeType: string;
}

export interface FeedbackTicket {
  id: string;
  userId: string;
  type: string;
  description: string;
  phone: string;
  status: FeedbackStatus;
  attachments: FeedbackAttachment[];
  createdAt: string;
}

export interface ControlSession {
  id: string;
  userId: string;
  stationId: string;
  stationName: string;
  deviceId: string;
  deviceCode: string;
  orderId: string;
  activeMode: ControlMode | null;
  isPaused: boolean;
  durationMinutes: number;
  amount: number;
}

export interface AuthTokenPayload {
  sub: string;
  username: string;
  exp: number;
}

export interface LoginResult {
  token: string;
  user: User;
  membership: Membership | null;
}
