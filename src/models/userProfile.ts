export type UserRole = 'admin' | 'premium' | 'user';

export type UserProfile = {
  age: number | null;
  countryCode: string | null;
  createdAt: string;
  email: string;
  name: string;
  plan: 'free' | 'premium';
  role: UserRole;
  uid: string;
  updatedAt: string;
};
