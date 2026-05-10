#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ExpenseTrackerStack } from "../lib/expense-tracker-stack";

const app = new cdk.App();

new ExpenseTrackerStack(app, "ExpenseTrackerStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
  tags: {
    Project: "expense-tracker",
    Environment: "dev",
  },
});
