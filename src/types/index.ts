export type NavItem = {
  key: string;
  label: string;
  icon: string;
  href: string;
};

export type StatusColor = {
  bg: string;
  text: string;
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  new_order: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-amber-100 text-amber-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  returned: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-200 text-gray-600',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-800',
  partial: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-rose-100 text-rose-800',
  rejected: 'bg-gray-200 text-gray-600',
};

export const CHEQUE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  received: 'bg-blue-100 text-blue-800',
  deposited: 'bg-indigo-100 text-indigo-800',
  cleared: 'bg-emerald-100 text-emerald-800',
  bounced: 'bg-red-100 text-red-800',
};

export const CREDIT_STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  due_soon: 'bg-amber-100 text-amber-800',
  overdue: 'bg-red-100 text-red-800',
  settled: 'bg-emerald-100 text-emerald-800',
};

export const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  initial_stock: 'bg-blue-100 text-blue-800',
  manual_add: 'bg-emerald-100 text-emerald-800',
  manual_remove: 'bg-red-100 text-red-800',
  correction: 'bg-amber-100 text-amber-800',
  shipped_order: 'bg-indigo-100 text-indigo-800',
  returned_order: 'bg-purple-100 text-purple-800',
  import_adjustment: 'bg-cyan-100 text-cyan-800',
};

export const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  commercial: 'bg-blue-100 text-blue-800',
  stock_manager: 'bg-emerald-100 text-emerald-800',
  accountant: 'bg-amber-100 text-amber-800',
  supervisor: 'bg-purple-100 text-purple-800',
};
