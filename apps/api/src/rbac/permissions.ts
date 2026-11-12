export type Role =
  | 'USER' | 'SUPER_ADMIN' | 'COMPLIANCE' | 'FINANCE'
  | 'TRADING_OPS' | 'SUPPORT' | 'AUDITOR';

export type Permission =
  | 'users:view' | 'users:suspend'
  | 'kyc:view' | 'kyc:approve'
  | 'finance:view' | 'finance:approve_withdrawal'
  | 'finance:reconcile'
  | 'trading:view' | 'trading:manage_instruments' | 'trading:manage_risk'
  | 'system:manage_providers' | 'system:view_audit'
  | 'orders:place' | 'wallet:view';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  USER:           ['wallet:view', 'orders:place'],
  SUPER_ADMIN:    [
    'users:view','users:suspend','kyc:view','kyc:approve',
    'finance:view','finance:approve_withdrawal','finance:reconcile',
    'trading:view','trading:manage_instruments','trading:manage_risk',
    'system:manage_providers','system:view_audit','wallet:view','orders:place',
  ],
  COMPLIANCE:     ['users:view','users:suspend','kyc:view','kyc:approve','system:view_audit'],
  FINANCE:        ['finance:view','finance:approve_withdrawal','finance:reconcile','system:view_audit'],
  TRADING_OPS:    ['trading:view','trading:manage_instruments','trading:manage_risk','system:manage_providers','system:view_audit'],
  SUPPORT:        ['users:view','users:suspend','kyc:view','system:view_audit'],
  AUDITOR:        ['users:view','finance:view','trading:view','system:view_audit'],
};