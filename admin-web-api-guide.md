# Admin & web portal API guide (frontend)

APIs for the **admin website** and **branch web portal**.  
**Not** for the mobile beneficiary app (see [user-management.md](user-management.md) for mobile `/me` and registration).

All requests go through the **API gateway**.

| Environment | Base URL |
|-------------|----------|
| Local | `http://localhost:8090` |
| Server / UAT | `http://<SERVER_IP>:8090` (or your HTTPS domain later) |

Paths below are relative to that base URL.

**Related deep-dive:** beneficiary list / verify / KYC details → [admin-beneficiary-management.md](admin-beneficiary-management.md)

---

## Contents

1. [Authentication & session](#1-authentication--session)
2. [Roles](#2-roles)
3. [Response envelope & pagination](#3-response-envelope--pagination)
4. [Screen → API map](#4-screen--api-map)
5. [Beneficiary management (HQ staff)](#5-beneficiary-management-hq-staff)
6. [Branch administration (ADMIN)](#6-branch-administration-admin)
7. [Branch portal (BRANCH role)](#7-branch-portal-branch-role)
8. [Beneficiary cases (workflow)](#8-beneficiary-cases-workflow)
9. [Zakat calculator (optional web)](#9-zakat-calculator-optional-web)
10. [Out of scope for admin web](#10-out-of-scope-for-admin-web)
11. [Quick endpoint index](#11-quick-endpoint-index)

---

## 1. Authentication & session

### Login (public)

```http
POST /api/auth/v1/login
Content-Type: application/json

{
  "username": "platform.admin",
  "password": "your-password"
}
```

Username may be a Keycloak username (e.g. `amiredris`) or an Ethiopian phone (`09…` / `+251…`). Phones are normalized to E.164.

**Success**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
    "expiresIn": 300,
    "tokenType": "Bearer",
    "passwordChangeRequired": false
  },
  "message": "Login successful"
}
```

If `passwordChangeRequired` is `true`, show change-password UI before continuing.

### Authorization header

On every protected call:

```http
Authorization: Bearer <accessToken>
```

### Current user profile

```http
GET /api/auth/v1/me
Authorization: Bearer <token>
```

**Response `data`**

| Field | Type | Notes |
|-------|------|-------|
| `sub` | string | Keycloak user id |
| `email` | string \| null | |
| `displayName` | string \| null | |
| `phone` | string \| null | |
| `roles` | string[] | e.g. `ADMIN`, `FIELD_OFFICER`, `BRANCH` |
| `donorSummary` | object \| null | Ignore for admin UI |

### Update profile

```http
PATCH /api/auth/v1/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "+251911223344",
  "displayName": "Admin User"
}
```

Both fields optional; only send what you change.

### Change password

```http
POST /api/auth/v1/me/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "old-password",
  "newPassword": "NewPass1@",
  "confirmNewPassword": "NewPass1@"
}
```

`newPassword` min length **6**. After success, ask the user to log in again.

### Keycloak metadata (optional / debug)

```http
GET /api/auth/v1/keycloak
```

Public. Returns realm / issuer info.

---

## 2. Roles

| Role | Portal | Capabilities |
|------|--------|--------------|
| `ADMIN` | HQ admin | Full staff + **verify/reject** + **branch admin** |
| `FIELD_OFFICER` | HQ admin | List/view/update beneficiaries, KYC download — **no** verify/reject, **no** branch admin |
| `BRANCH` | Branch portal | Own branch profile + own registration codes only |

Roles come from the JWT (`realm_access.roles` and/or client roles). Use `GET /api/auth/v1/me` → `roles` to gate menus.

| Action | ADMIN | FIELD_OFFICER | BRANCH |
|--------|:-----:|:-------------:|:------:|
| Login / me / password | ✓ | ✓ | ✓ |
| List / view / patch beneficiaries | ✓ | ✓ | |
| Verify / reject | ✓ | | |
| Institution KYC list / download | ✓ | ✓ | |
| Admin branches & generate codes | ✓ | | |
| Branch portal `/branch/*` | | | ✓ |
| Zakat calculate | ✓* | ✓* | ✓* |

\*Any authenticated JWT (no extra role check in code).

---

## 3. Response envelope & pagination

### JSON envelope

```json
{
  "success": true,
  "data": { },
  "message": "Optional message"
}
```

Errors: `success: false` with HTTP `400` / `401` / `403` / `404` / `409`, etc.

### Pagination (list endpoints)

```json
{
  "success": true,
  "data": {
    "items": [ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 42,
      "totalPages": 3
    }
  }
}
```

- `page` is **1-based**
- Default `page=1`, `limit=20` (max `100`)

### File downloads

KYC documents and profile pictures return **raw file bytes** (not the JSON envelope). Use `Authorization` header; set `download=true` when the browser should download.

---

## 4. Screen → API map

| Screen | Primary APIs |
|--------|----------------|
| Login | `POST /api/auth/v1/login` |
| Forced password change | `POST /api/auth/v1/me/password` |
| App shell / user menu | `GET /api/auth/v1/me` |
| All beneficiaries | `GET /api/beneficiaries/v1/beneficiaries` |
| Institution review queue | `GET /api/beneficiaries/v1/institutions` |
| Beneficiary detail | `GET /api/beneficiaries/v1/beneficiaries/{id}` |
| Edit beneficiary | `PATCH /api/beneficiaries/v1/beneficiaries/{id}` |
| Approve / reject | `PATCH .../verification` (**ADMIN**) |
| Company KYC checklist | `GET .../institution-documents` |
| KYC file preview/download | `GET .../institution-documents/{documentCode}` |
| Profile picture | `GET .../profile-picture` |
| Branches list / create | `/api/beneficiaries/v1/admin/branches` (**ADMIN**) |
| Generate / list registration codes | `.../admin/branches/{id}/codes` (**ADMIN**) |
| Branch officer home | `GET /api/beneficiaries/v1/branch/me` (**BRANCH**) |
| Branch codes | `GET /api/beneficiaries/v1/branch/codes` (**BRANCH**) |
| Case workflow (if enabled) | `POST /cases`, `PATCH /cases/{id}/status` |
| Zakat calculator | `POST /api/zakat/v1/calculate` |

---

## 5. Beneficiary management (HQ staff)

**Roles:** `ADMIN` or `FIELD_OFFICER` (verify = **ADMIN only**).

Full field tables, examples, and enums: **[admin-beneficiary-management.md](admin-beneficiary-management.md)**.

### Summary

| Method | Path | Roles | Purpose |
|--------|------|-------|---------|
| GET | `/api/beneficiaries/v1/beneficiaries` | ADMIN, FIELD_OFFICER | Paginated registry. Query: `search`, `verificationStatus`, `beneficiaryType`, `page`, `limit` |
| GET | `/api/beneficiaries/v1/institutions` | ADMIN, FIELD_OFFICER | Institution queue. Query: `search`, `verificationStatus`, `kycComplete`, `page`, `limit` |
| GET | `/api/beneficiaries/v1/beneficiaries/{id}` | ADMIN, FIELD_OFFICER | Full profile |
| PATCH | `/api/beneficiaries/v1/beneficiaries/{id}` | ADMIN, FIELD_OFFICER | Partial update (not verification) |
| PATCH | `/api/beneficiaries/v1/beneficiaries/{id}/verification` | **ADMIN** | `{ verificationStatus: "verified"\|"rejected", reason? }` — `reason` required if rejected |
| GET | `/api/beneficiaries/v1/beneficiaries/{id}/institution-documents` | ADMIN, FIELD_OFFICER | KYC checklist metadata |
| GET | `/api/beneficiaries/v1/beneficiaries/{id}/institution-documents/{documentCode}` | ADMIN, FIELD_OFFICER | File stream. Query: `download` |
| GET | `/api/beneficiaries/v1/beneficiaries/{id}/profile-picture` | ADMIN, FIELD_OFFICER | Image stream. Query: `download` |

### Common enums (strings in JSON)

| Field | Values |
|-------|--------|
| `beneficiaryType` | `individual`, `institution` |
| `verificationStatus` (filter/list) | `pending`, `pending_third_party`, `verified`, `rejected` |
| `verificationStatus` (PATCH verify) | `verified`, `rejected` only |
| `beneficiaryCategory` | e.g. `poor`, `needy`, `debtor`, … (see admin-beneficiary doc) |
| `institutionSubtype` | `company`, `ngo`, `government`, `cooperative`, `other` |

### Document codes (KYC)

| Code | Document |
|------|----------|
| `TRADE_REGISTRATION` | Trade / commercial registration |
| `TAX_STATUS` | TIN / tax certificate |
| `AUTHORITY_TO_ACT` | Board resolution / POA (optional unless required at registration) |

---

## 6. Branch administration (ADMIN)

Base path: `/api/beneficiaries/v1/admin/branches`  
**Role:** `ADMIN` only.

### Create branch

Creates the branch and provisions a Keycloak user with role `BRANCH` (login = `branchPhone`).

```http
POST /api/beneficiaries/v1/admin/branches
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Bole Branch",
  "region": "Addis Ababa",
  "zone": "Bole",
  "woreda": "Woreda 03",
  "branchPhone": "+251911000001",
  "branchEmail": "bole@example.com",
  "branchFullName": "Branch Officer Name"
}
```

**Important:** Response includes one-time credentials — show/copy once in UI:

| Field | Notes |
|-------|-------|
| `branchPhone` | Login username (E.164) |
| `initialPassword` | Temporary password — share offline |
| `passwordChangeRequired` | Usually `true` → branch officer must change password after first login |

Also returns `id`, location fields, `active`, `codeStats`.

### List / get / activate

```http
GET /api/beneficiaries/v1/admin/branches?page=1&limit=20
GET /api/beneficiaries/v1/admin/branches/{id}
PATCH /api/beneficiaries/v1/admin/branches/{id}
Content-Type: application/json

{ "active": false }
```

### `codeStats` object

| Field | Meaning |
|-------|---------|
| `available` | Unused codes |
| `reserved` | Held for in-progress Fayda registration |
| `consumed` | Used by a completed registration |
| `revoked` | Revoked |

### Generate registration codes

```http
POST /api/beneficiaries/v1/admin/branches/{id}/codes
Authorization: Bearer <token>
Content-Type: application/json

{ "quantity": 50 }
```

`quantity`: **1–500**.  
`data` is a `string[]` of plain codes (printable / exportable).

### List codes for a branch

```http
GET /api/beneficiaries/v1/admin/branches/{id}/codes?status=AVAILABLE&page=1&limit=20
```

| Query | Values |
|-------|--------|
| `status` | optional: `AVAILABLE`, `RESERVED`, `CONSUMED`, `REVOKED` |

Each item: `id`, `code`, `status`, `beneficiaryId`, `consumedAt`, `createdAt`.

---

## 7. Branch portal (BRANCH role)

For branch officers logging in with the phone/password from branch create.

Base path: `/api/beneficiaries/v1/branch`

### My branch

```http
GET /api/beneficiaries/v1/branch/me
Authorization: Bearer <token>
```

Returns: `name`, `region`, `zone`, `woreda`, `codeStats`.

### My registration codes

```http
GET /api/beneficiaries/v1/branch/codes?status=AVAILABLE&page=1&limit=20
Authorization: Bearer <token>
```

Same code list shape as admin list codes (scoped to the logged-in branch only).

---

## 8. Beneficiary cases (workflow)

Authenticated JWT required. **No `@PreAuthorize` role** in current code (any logged-in user can call). Product should still restrict UI to HQ staff unless you tighten backend later.

Allowed transitions:

```text
SUBMITTED → VERIFIED → APPROVED → ACTIVE → CLOSED
```

Illegal transition → **409**.

### Create case

```http
POST /api/beneficiaries/v1/cases
Authorization: Bearer <token>
Content-Type: application/json

{
  "beneficiaryId": 42,
  "region": "Addis Ababa",
  "notes": "Field visit scheduled"
}
```

Starts in status `SUBMITTED`.

### Transition status

```http
PATCH /api/beneficiaries/v1/cases/{caseId}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetStatus": "VERIFIED",
  "reason": "Documents checked"
}
```

**Response fields:** `id`, `beneficiaryId`, `status`, `region`, `notes`, `lastTransitionReason`, `createdAt`, `updatedAt`.

---

## 9. Zakat calculator (optional web)

Authenticated JWT. Useful for an internal calculator screen (not donation admin).

### Active nisab policy

```http
GET /api/zakat/v1/policies/active?asOf=2026-07-30T00:00:00Z
Authorization: Bearer <token>
```

### Calculate

```http
POST /api/zakat/v1/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "asOf": "2026-07-30T00:00:00Z",
  "assets": [
    { "type": "CASH", "amountMinor": 10000000, "notes": "ETB minor units" },
    { "type": "GOLD", "amountMinor": 500000, "notes": null }
  ]
}
```

`type`: `CASH` | `GOLD` | `SILVER` | `TRADE_GOODS` | `OTHER`  
`amountMinor`: non-negative integer (minor currency units).

Response includes `payableMinor`, `eligible`, `nisabMinor`, breakdown hashes, etc.

---

## 10. Out of scope for admin web

Do **not** wire these into the HQ/branch admin SPA (mobile / public / internal):

| Area | Paths |
|------|--------|
| Mobile beneficiary self-service | `/api/beneficiaries/v1/me/**` |
| Public registration | `POST /api/beneficiaries/v1/beneficiaries`, companies, Fayda SSE/callbacks |
| Set initial password (registration) | `POST /api/beneficiaries/v1/accounts/set-password` |
| Validate registration code (mobile) | `POST /api/beneficiaries/v1/registration-codes/validate` |
| Guest donations | `/api/payments/v1/donations/**`, payment callbacks |
| Service-to-service | `/api/auth/v1/internal/**` |

---

## 11. Quick endpoint index

### Auth

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/v1/login` | Public |
| GET | `/api/auth/v1/me` | Bearer |
| PATCH | `/api/auth/v1/me` | Bearer |
| POST | `/api/auth/v1/me/password` | Bearer |
| GET | `/api/auth/v1/keycloak` | Public |

### Beneficiaries (HQ)

| Method | Path | Roles |
|--------|------|-------|
| GET | `/api/beneficiaries/v1/beneficiaries` | ADMIN, FIELD_OFFICER |
| GET | `/api/beneficiaries/v1/institutions` | ADMIN, FIELD_OFFICER |
| GET | `/api/beneficiaries/v1/beneficiaries/{id}` | ADMIN, FIELD_OFFICER |
| PATCH | `/api/beneficiaries/v1/beneficiaries/{id}` | ADMIN, FIELD_OFFICER |
| PATCH | `/api/beneficiaries/v1/beneficiaries/{id}/verification` | ADMIN |
| GET | `/api/beneficiaries/v1/beneficiaries/{id}/institution-documents` | ADMIN, FIELD_OFFICER |
| GET | `/api/beneficiaries/v1/beneficiaries/{id}/institution-documents/{documentCode}` | ADMIN, FIELD_OFFICER |
| GET | `/api/beneficiaries/v1/beneficiaries/{id}/profile-picture` | ADMIN, FIELD_OFFICER |

### Branches (ADMIN)

| Method | Path |
|--------|------|
| POST | `/api/beneficiaries/v1/admin/branches` |
| GET | `/api/beneficiaries/v1/admin/branches` |
| GET | `/api/beneficiaries/v1/admin/branches/{id}` |
| PATCH | `/api/beneficiaries/v1/admin/branches/{id}` |
| POST | `/api/beneficiaries/v1/admin/branches/{id}/codes` |
| GET | `/api/beneficiaries/v1/admin/branches/{id}/codes` |

### Branch portal (BRANCH)

| Method | Path |
|--------|------|
| GET | `/api/beneficiaries/v1/branch/me` |
| GET | `/api/beneficiaries/v1/branch/codes` |

### Cases

| Method | Path |
|--------|------|
| POST | `/api/beneficiaries/v1/cases` |
| PATCH | `/api/beneficiaries/v1/cases/{caseId}/status` |

### Zakat

| Method | Path |
|--------|------|
| GET | `/api/zakat/v1/policies/active?asOf=` |
| POST | `/api/zakat/v1/calculate` |

---

## Frontend tips

1. Store `accessToken`; attach `Authorization: Bearer` on all protected calls.
2. After login, call `GET /me` and branch UI by `roles`.
3. On **403**, show “insufficient permissions” (e.g. FIELD_OFFICER hitting verify).
4. On **401**, clear token and redirect to login.
5. When creating a branch, force an admin to copy `branchPhone` + `initialPassword` before leaving the page.
6. Use the gateway base URL only — never call `:8081` / `:8083` from the browser in production.

---

## Questions / changes

Backend Swagger (per service, for local debugging):

- Auth: `http://localhost:8081/swagger-ui/index.html`
- Beneficiary: `http://localhost:8083/swagger-ui/index.html`
- Zakat: `http://localhost:8082/swagger-ui/index.html`

Production clients should use the **gateway** (`:8090` or HTTPS domain), not service ports directly.
