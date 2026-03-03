// Tipos TypeScript para LinkBio Brasil

// ============================================
// User
// ============================================
export interface User {
  id: string;
  email: string;
  name?: string | null;
  username: string;
  password?: string | null;
  image?: string | null;
  bio?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDTO {
  name?: string;
  email?: string;
  bio?: string;
  image?: string;
}

// ============================================
// Link
// ============================================
export interface Link {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  icon?: string | null;
  position: number;
  isActive: boolean;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface LinkDTO {
  title: string;
  url: string;
  description?: string;
  icon?: string;
  position?: number;
  isActive?: boolean;
}

export interface LinkUpdateDTO {
  title?: string;
  url?: string;
  description?: string;
  icon?: string;
  position?: number;
  isActive?: boolean;
}

// ============================================
// Click
// ============================================
export interface Click {
  id: string;
  createdAt: Date;
  userAgent?: string | null;
  referrer?: string | null;
  country?: string | null;
  city?: string | null;
  linkId: string;
}

// ============================================
// Subscription
// ============================================
export type Plan = 'free' | 'starter' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'past_due';

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  plan: Plan;
  stripeCustomerId?: string | null;
  stripePriceId?: string | null;
  currentPeriodEnd?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// ============================================
// API Responses
// ============================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================
// Auth
// ============================================
export interface SignUpDTO {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface SignInDTO {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  username: string;
}

// ============================================
// Upload
// ============================================
export interface UploadResponse {
  url: string;
  filename: string;
  success: boolean;
}

// ============================================
// QR Code
// ============================================
export interface QRCodeDTO {
  username: string;
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

// ============================================
// Stripe
// ============================================
export interface CheckoutSessionDTO {
  priceId: string;
  userId: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

// ============================================
// Integrations
// ============================================
export interface ConnectedAccount {
  provider: 'google' | 'github' | 'twitter' | 'instagram';
  providerAccountId: string;
  connectedAt: Date;
}

export interface IntegrationDTO {
  provider: string;
  accessToken?: string;
  refreshToken?: string;
}

// ============================================
// Planos
// ============================================
export interface PlanLimits {
  free: {
    maxLinks: 5;
    maxThemes: 1;
    analytics: 'basic';
    customDomain: false;
  };
  starter: {
    maxLinks: 15;
    maxThemes: 5;
    analytics: 'basic' | 'advanced';
    customDomain: false;
  };
  pro: {
    maxLinks: 'unlimited';
    maxThemes: 'unlimited';
    analytics: 'basic' | 'advanced';
    customDomain: true;
  };
  premium: {
    maxLinks: 'unlimited';
    maxThemes: 'unlimited';
    analytics: 'complete';
    customDomain: true;
  };
}

// ============================================
// Utility Types
// ============================================
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
