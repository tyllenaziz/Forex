# Forex Trading Platform

## Build Order
1. Foundation (auth, RBAC, audit)
2. Ledger (double-entry — the financial core)
3. Registration + KYC
4. Payments (sandbox PSP)
5. Market data
6. Demo trading
7. Admin portal
8. Real broker adapter (disabled)
9. Notifications
10. Security hardening

## Invariants
- No float money — BIGINT minor units
- All movements via postEntry()
- Double-entry: Σ debit = Σ credit
- Demo ≠ real (separate namespaces)
- Binary options simulation-only
- RBAC enforced server-side
- Secrets only in env / secrets manager
- Reconciliation is continuous