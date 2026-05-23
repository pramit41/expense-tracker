# Expense Tracker — Project Progressionß Instruction

This file gives Claude full context to continue helping with this project.
Attach it at the start of a new conversation.

---

## What this project is

An AI-powered expense tracker where users upload receipt photos and Claude's
vision API will eventually extract merchant, amount, date, and category.
Built as a learning project to develop full-stack and AI engineering skills.

**Developer background:**
- 2.5 years experience as a software engineer at a financial company
- Strong in Angular (frontend) and Java (backend REST APIs)
- Has worked with AWS: Lambda, S3, DynamoDB
- Goals: become a well-rounded full-stack engineer and build AI skills

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17 (standalone components, signals) |
| UI library | Angular Material |
| Auth | AWS Cognito + AWS Amplify v6 (in Angular) |
| API | AWS API Gateway (REST) |
| Backend | AWS Lambda (Node.js 20) |
| Database | DynamoDB |
| File storage | S3 |
| AI | Claude API — vision model for receipt parsing |
| Infrastructure | AWS CDK v2 (TypeScript) |
| Package manager | npm workspaces |

---

## Project structure

```
~/Documents/expense-tracker/
├── infra/                          # AWS CDK stack (TypeScript)
│   ├── bin/app.ts                  # CDK entry point
│   ├── cdk.json
│   ├── package.json
│   ├── tsconfig.json
│   └── lib/
│       └── expense-tracker-stack.ts  # Main stack — all AWS resources defined here
├── lambdas/
│   ├── hello/
│   │   └── index.js               # Phase 1 smoke test Lambda (GET /health)
│   ├── upload/
│   │   └── index.js               # Phase 3 presigned upload Lambda
│   └── expenses/
│       └── index.js               # Phase 3 expenses CRUD Lambda
├── angular/                        # Angular 17 frontend
│   ├── angular.json
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts
│       ├── index.html
│       ├── styles.scss
│       ├── environments/
│       │   ├── environment.ts       # ⚠️ Fill in after cdk deploy
│       │   └── environment.prod.ts
│       └── app/
│           ├── app.component.ts     # Root shell — just <router-outlet>
│           ├── app.config.ts        # Bootstraps Amplify + HTTP interceptor
│           ├── app.routes.ts        # Routes: /login, /register, /expenses
│           ├── auth/
│           │   ├── auth.service.ts  # Wraps Amplify: login, register, logout, getIdToken
│           │   ├── auth.guard.ts    # Protects /expenses route
│           │   ├── login/
│           │   │   └── login.component.ts
│           │   └── register/
│           │       └── register.component.ts  # Has email confirm step built in
│           ├── expenses/
│           │   ├── expense.model.ts
│           │   ├── expense.service.ts
│           │   └── expenses.component.ts      # Phase 3 expense UI
│           └── shared/
│               └── auth.interceptor.ts        # Auto-attaches JWT to every API request
└── CLAUDE_HANDOFF.md               # This file
```

---

## What's been built (Phases 1–3 complete)

### Phase 1 — CDK foundation ✅
- CDK project scaffolded with TypeScript
- API Gateway deployed with a `GET /health` route
- Hello Lambda wired up as a smoke test
- Shared Lambda IAM role defined
- CloudWatch log group for API Gateway
- CORS configured for `localhost:4200`

### Phase 2 — Cognito auth + Angular shell ✅
- Cognito User Pool created with email sign-up and verification
- Cognito App Client configured with SRP auth flow
- Cognito Hosted UI domain set up (`expense-tracker-dev`)
- Angular 17 app scaffolded with standalone components and signals
- Amplify v6 configured in `app.config.ts`
- Login and Register components built (Register includes email confirm step)
- `AuthService` using Angular signals (`currentUser`, `isLoading`)
- `authGuard` protecting the `/expenses` route
- `authInterceptor` auto-attaching JWT to all API requests
- Expenses component protects the app shell and signs users out cleanly
- Verified end-to-end auth flow from register to `/expenses`

### Phase 3 — S3 + DynamoDB + expenses CRUD ✅
- S3 bucket created for receipt image uploads
- DynamoDB table created for expense records
- `UploadLambda` returns presigned S3 URLs for direct browser upload (with user ID metadata)
- `ExpensesLambda` implements:
  - `GET /expenses`
  - `POST /expenses`
  - `DELETE /expenses/{id}`
- Angular expense UI now supports:
  - receipt upload
  - manual expense creation
  - expense listing
  - expense deletion
- Existing auth and API protection are wired through Cognito and Amplify

### Phase 4 — Claude vision receipt parsing and auto-expense creation ✅
- Receipt parser Lambda created and deployed
- S3 event notifications configured to trigger parser on file upload
- User identity (user ID) captured in S3 object metadata during upload
- Claude vision API integration extracts merchant, amount, date, and category from receipt images
- Parsed expenses automatically saved to DynamoDB with receipt reference
- End-to-end flow verified: upload receipt → parse with Claude → save to DynamoDB → appear in expense list

---

## Known issues / decisions made

- **Image rendering is not implemented yet.** Receipts are uploaded to S3, but the UI does not display a receipt preview.
- **S3 bucket CORS** is configured for dev browser upload from `http://localhost:4200`.
- **Default Cognito email sender** is still in use, which is fine for dev but should switch to SES before production.
- **CDK domain prefix** `expense-tracker-dev` must be globally unique for Cognito Hosted UI.

---

## Environment values needed

After `cdk deploy`, paste the output values into
`angular/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://REPLACE_ME.execute-api.us-east-1.amazonaws.com/dev',
  cognito: {
    userPoolId: 'us-east-1_REPLACE_ME',
    userPoolClientId: 'REPLACE_ME',
    region: 'us-east-1',
  },
};
```

---

## Build phases overview

| Phase | Status | What it adds |
|-------|--------|-------------|
| 1 | ✅ Done | CDK, API Gateway, hello Lambda |
| 2 | ✅ Done | Cognito, Angular shell, login/register/logout |
| 3 | ✅ Done | S3 upload, DynamoDB CRUD, expenses CRUD UI |
| 4 | ✅ Done | Claude vision receipt parsing and auto-expense creation |
| 5 | 🔲 Next | Angular dashboard, charts, category editor |
| Stretch | 🔲 | SNS budget alerts, CSV export, multi-user households |

---

## Phase 5 plan (next)

Phase 5 adds analytics and visualization capabilities.

**What to build next:**
- Angular dashboard with expense summary and charts
- Category breakdown visualization
- Monthly expense trends
- Budget editor for custom categories
- Expense filtering and search

**Expected result:**
- Users can visualize spending patterns
- Dashboard shows expense breakdown by category
- Interactive charts for expense trends over time
- Ability to manage and edit expense categories

---

## Useful commands

```bash
# Deploy infra changes
cd ~/Documents/expense-tracker/infra
npm run deploy

# See what CDK will change before deploying
npm run diff

# Run Angular dev server
cd ~/Documents/expense-tracker/angular
npm start

# Tear down all AWS resources (avoids charges)
cd ~/Documents/expense-tracker/infra
npm run destroy
```

---