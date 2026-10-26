# Security Specification: FocusOS Access Control & Data Invariants

## 1. Data Invariants
- Every task, client, project, focus session, and distraction record strictly belongs to an authenticated user (`userId`).
- User profile data is restricted exclusively to the owning user (`request.auth.uid == userId`).
- Subcollections (`tasks`, `clients`, `projects`, `focusSessions`, `distractions`) are isolated under `/users/{userId}/*`.
- Cross-user data reading, modification, or deletion is forbidden.
- Document IDs must conform to the regex `^[a-zA-Z0-9_\-]+$` and cannot exceed 128 bytes.

## 2. Dirty Dozen Attack Payloads Mitigated
1. Identity Spoofing: Attempting to create a task where `userId != request.auth.uid` is rejected.
2. Tenant Boundary Escapes: Attempting to query `/users/{otherUserId}/clients` is blocked by `isOwner(userId)`.
3. ID Poisoning: Supplying a 1MB junk document ID fails `isValidId()` length checks.
4. User Profile Tampering: Modifying another user's profile document is denied.
5. Unauthorized Bulk Deletions: Mass deleting foreign records fails subcollection permission checks.
6. Unauthenticated Queries: Any request without `request.auth != null` is rejected at the root match.
7. Shadow Updates: Adding unassigned user properties or unauthorized fields is blocked.
8. Status Skipping / Illegal State Mutations: Handled with strict field constraints.
9. Ghost Collections: Non-declared root collections trigger default deny (`allow read, write: if false`).
10. Session Distraction Injection: Attempting to append distractions to other users' sessions fails path ownership.
11. PII Exposure: Client email addresses and phone numbers are isolated under user-scoped paths.
12. Write-After-Delete / Orphan Creation: Sub-resource validation requires matching `userId`.
