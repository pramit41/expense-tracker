/**
 * Hello Lambda — Phase 1 smoke test
 *
 * This is intentionally simple. Its only job is to confirm that:
 *   1. CDK deployed successfully
 *   2. API Gateway can invoke a Lambda
 *   3. CORS headers are working
 *
 * In Phase 3 this file gets replaced by real Lambda handlers
 * (upload.js, expenses.js, process.js).
 */

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      message: "Expense Tracker API is up",
      phase: 1,
      timestamp: new Date().toISOString(),
      path: event.path ?? "/health",
    }),
  };
};
