# Architecture & Multi-Tenant Design Document

## 1. Multi-Tenant Isolation Strategy

The system implements a **shared database, shared schema with discriminant column (`school_id`)** pattern.

### 1.1 Enforcement Layers
Tenant isolation is enforced across three sequential architectural layers:

1. **Token Verification**:
   - The verified JWT access token contains the authenticated user's `schoolId` and assigned role/permissions.
2. **Tenant Middleware (`tenant.middleware.ts`)**:
   - For all non-superadmin requests, `req.schoolId` is strictly extracted from `req.user.schoolId`.
   - If a request supplies a header `x-school-id` that conflicts with `req.user.schoolId`, the request is rejected with `403 Forbidden`.
   - Ensures the school institution exists and `isActive === true`.
3. **Repository Layer & Ownership Chain Validation**:
   - Every database query automatically restricts records with `where: { schoolId }`.
   - For hierarchical relationships such as:
     ```text
     School
       └── Class
            └── Section
     ```
     `ClassRepository.createSection` and `findSectionById` validate the entire ownership chain:
     ```typescript
     // Validate parent class belongs to this school
     const parentClass = await prisma.class.findFirst({
       where: { id: classId, schoolId },
     });
     if (!parentClass) {
       throw new Error('Parent class not found or belongs to another school');
     }
     ```
   - Even if an attacker knows the UUID of a class or section from another school, they cannot read, link, or mutate it.

---

## 2. Authentication Flow & Token Lifecycle

```text
Client                    Backend API                MySQL Database
  │                            │                            │
  ├─── POST /api/auth/login ──>│                            │
  │    (email, password,       ├─── Verify bcrypt hash ────>│
  │     schoolCode)            ├─── Store SHA-256 token ───>│
  │                            │    in refresh_tokens       │
  │<── 200 OK ─────────────────┤                            │
  │    - Access Token (15m)    │                            │
  │    - Set-Cookie (7d)       │                            │
  │                            │                            │
  ├─── GET /api/classes ──────>│                            │
  │    (Authorization: Bearer) ├─── Verify JWT & Tenant ───>│
  │<── 200 OK (Classes Data) ──┤                            │
  │                            │                            │
  │  [Access Token Expires]    │                            │
  │                            │                            │
  ├─── POST /api/auth/refresh >│                            │
  │    (Cookie: school_refresh)├─── Revoke old token ──────>│
  │                            ├─── Store new token hash ──>│
  │<── 200 OK ─────────────────┤                            │
  │    - New Access Token      │                            │
  │    - New Set-Cookie        │                            │
```

---

## 3. RBAC Enforcement Matrix

Permissions are fine-grained strings formatted as `<module>:<action>` or `<module>:<submodule>:<action>`.

- `SUPER_ADMIN`: Master system bypass. Can inspect schools, manage global configurations.
- `SCHOOL_ADMIN`: Full administrative control over school entities (`school:update`, `user:*`, `academic:session:*`, `class:*`, `section:*`).
- `PRINCIPAL`: Academic oversight. Can manage sessions, classes, and sections. Read-only staff access.
- `ACCOUNTANT`: Read-only access to academic structure. (Prepared for Phase 3 Fee engine).
- `TEACHER`: Read-only access to classes and sections.
- `RECEPTIONIST`: Read-only access to classes and sections.
