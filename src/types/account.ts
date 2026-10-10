export type AccountType = 'elyby' | 'offline';

export interface Account {
  id: string;
  username: string;
  type: AccountType;
  uuid?: string;
  accessToken?: string;
  clientToken?: string;
  skinUrl?: string; // Base64 data URL or external texture URL
  skinAvatarUrl?: string; // Extracted 2D head avatar (Base64)
  skinModel?: 'classic' | 'slim';
  email?: string;
  createdAt: number;
}
