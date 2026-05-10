import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import * as path from "path";

export class ExpenseTrackerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

        // ── Cognito User Pool ─────────────────────────────────────
    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "expense-tracker-users",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
 
    // App client — what the Angular app uses to authenticate
    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool,
      userPoolClientName: "expense-tracker-angular",
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: ["http://localhost:4200/callback"],
        logoutUrls: ["http://localhost:4200"],
      },
      preventUserExistenceErrors: true,
    });
 
    // Hosted UI domain
    const userPoolDomain = userPool.addDomain("UserPoolDomain", {
      cognitoDomain: {
        // Must be globally unique — change this if deploy fails
        domainPrefix: "expense-tracker-dev",
      },
    });

    // ── Shared Lambda execution role ──────────────────────────────────────
    // We define one role here and will add permissions to it as phases progress.
    // Phase 2 will add Cognito permissions, Phase 3 will add S3 + DynamoDB, etc.
    const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      description: "Shared execution role for all expense tracker Lambdas",
      managedPolicies: [
        // Gives CloudWatch Logs access — the minimum every Lambda needs
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    // ── CloudWatch log group for API Gateway ─────────────────────────────
    // Explicit log group so we control retention (avoids infinite log buildup)
    const apiLogGroup = new logs.LogGroup(this, "ApiGatewayLogs", {
      logGroupName: "/expense-tracker/api-gateway",
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // clean up on cdk destroy
    });

    // ── Hello Lambda (Phase 1 smoke test) ────────────────────────────────
    const helloLambda = new lambda.Function(this, "HelloLambda", {
      functionName: "expense-tracker-hello",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../lambdas/hello")
      ),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        // We'll add DYNAMODB_TABLE, S3_BUCKET, etc. in later phases
        NODE_ENV: "production",
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // ── API Gateway ───────────────────────────────────────────────────────
    const api = new apigateway.RestApi(this, "ExpenseTrackerApi", {
      restApiName: "expense-tracker-api",
      description: "Expense Tracker REST API",
      deployOptions: {
        stageName: "dev",
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      // CORS — Angular dev server runs on localhost:4200
      defaultCorsPreflightOptions: {
        allowOrigins: [
          "http://localhost:4200",
          // Add your deployed frontend URL here later
        ],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Api-Key",
        ],
      },
    });

    // ── Cognito authorizer ────────────────────────────────────────
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [userPool],
        authorizerName: "expense-tracker-authorizer",
        identitySource: "method.request.header.Authorization",
      }
    );

    // This line is what was missing — explicitly binds the authorizer to the API
    authorizer._attachToApi(api);

    // ── Routes ────────────────────────────────────────────────────────────
    // GET /health — wired to helloLambda as a smoke test
    // Phase 3 will add: POST /expenses, GET /expenses, DELETE /expenses/{id}
    // Phase 3 will add: POST /uploads/presigned-url
    const health = api.root.addResource("health");
    health.addMethod(
      "GET",
      new apigateway.LambdaIntegration(helloLambda),
      {
        authorizationType: apigateway.AuthorizationType.NONE,
      }
    );

    // ── Outputs ───────────────────────────────────────────────
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      exportName: "ExpenseTrackerApiUrl",
    });
 
    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "Paste into angular/src/environments/environment.ts",
      exportName: "ExpenseTrackerUserPoolId",
    });
 
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      description: "Paste into angular/src/environments/environment.ts",
      exportName: "ExpenseTrackerUserPoolClientId",
    });
 
    new cdk.CfnOutput(this, "CognitoHostedUiUrl", {
      value: userPoolDomain.baseUrl(),
      description: "Cognito Hosted UI base URL",
    });
 
    new cdk.CfnOutput(this, "LambdaRoleArn", {
      value: lambdaRole.roleArn,
    });
  }
}
