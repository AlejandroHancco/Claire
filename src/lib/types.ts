export type TransactionType = 'Ingreso' | 'Egreso';

export const INGRESO_CATEGORIES = ['Sueldo', 'Depósito', 'Transferencia', 'Negocio', 'Inversión', 'Bono', 'Otro'] as const;
export const EGRESO_CATEGORIES = ['Alimentación', 'Transporte', 'Alojamiento', 'Salidas', 'Servicios', 'Salud', 'Educación', 'Ropa', 'Comida', 'Otro'] as const;

export type IngresoCategory = typeof INGRESO_CATEGORIES[number];
export type EgresoCategory = typeof EGRESO_CATEGORIES[number];

export interface Profile {
  id: string;
  display_name: string;
  avatar_color: string;
  avatar_url?: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  description?: string | null;
  responsible: string;
  created_at: string;
  profile?: Pick<Profile, 'display_name' | 'avatar_color' | 'avatar_url'> | null;
}

export interface TransactionFilters {
  dateFrom: string;
  dateTo: string;
  type: 'All' | TransactionType;
  category: string;
  responsible: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline?: string | null;
  created_by: string;
  created_at?: string;
}

export interface MonthlyNote {
  id: string;
  user_id: string;
  month: string;
  note: string;
  created_at?: string;
}

export const AVATAR_COLORS: { name: string; value: string }[] = [
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Rosa', value: '#f43f5e' },
  { name: 'Ámbar', value: '#f59e0b' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Cielo', value: '#0ea5e9' },
  { name: 'Violeta', value: '#8b5cf6' },
];
