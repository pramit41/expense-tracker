# Expense Tracker

AI-powered expense tracking app built with Angular, AWS (CDK, Lambda, API Gateway, S3, DynamoDB, Cognito), and the Claude API.

## Project structure

```
expense-tracker/
├── infra/               # AWS CDK infrastructure (TypeScript)
│   ├── bin/app.ts       # CDK app entry point
│   └── lib/             # Stack definitions
│       └── expense-tracker-stack.ts
├── lambdas/             # Lambda function handlers
│   └── hello/           # Phase 1 smoke test
└── angular/             # Angular frontend (added in Phase 2)
```

## Phase 1 setup — get deployed in ~20 minutes

### Prerequisites

```bash
# 1. Node 18+ required
node --version

# 2. Install AWS CLI and configure your credentials
aws configure
# Enter your AWS Access Key ID, Secret, and default region (e.g. us-east-1)

# 3. Install CDK globally
npm install -g aws-cdk

# 4. Bootstrap CDK in your AWS account (one-time per account/region)
cdk bootstrap
```

### Deploy

```bash
# From the repo root
cd infra
npm install
npm run deploy
```

After deploy, CDK will print your API URL:
```
Outputs:
ExpenseTrackerStack.ApiUrl = https://xxxx.execute-api.us-east-1.amazonaws.com/dev/
```

### Smoke test

```bash
curl https://xxxx.execute-api.us-east-1.amazonaws.com/dev/health
```

Expected response:
```json
{
  "message": "Expense Tracker API is up",
  "phase": 1,
  "timestamp": "2026-05-05T..."
}
```

### Tear down (avoid charges)

```bash
cd infra
npm run destroy
```

---

## Build phases

| Phase | What gets built | New skills |
|-------|----------------|------------|
| 1 | CDK + API Gateway + hello Lambda | CDK, IAM |
| 2 | Cognito auth + Angular shell | Cognito, JWT |
| 3 | S3 upload + DynamoDB CRUD | S3, DynamoDB |
| 4 | Claude API receipt parsing | Claude vision API |
| 5 | Angular dashboard + charts | Angular Material |

---

## Useful CDK commands

```bash
cdk synth        # Preview the CloudFormation template (no deploy)
cdk diff         # See what will change before deploying
cdk deploy       # Deploy to AWS
cdk destroy      # Delete all AWS resources
```
