export enum UserRole {
  CONSUMER = 'consumer',
  STORE = 'store',
  DELIVERY = 'delivery',
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  storeName?: string;
}

export interface AuthenticateUserDTO {
  email: string;
  password: string;
}