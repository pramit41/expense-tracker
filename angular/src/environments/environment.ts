// Fill these in after running `cdk deploy` in the infra/ folder.
// The values come from the CDK Outputs printed in your terminal.
export const environment = {
  production: false,
  apiUrl: 'https://jn0436srk6.execute-api.us-east-1.amazonaws.com/dev/',
  cognito: {
    userPoolId: 'us-east-1_zvDedvZqv',
    userPoolClientId: 'ts9kmcep1ohqn8dedofldielg',
    region: 'us-east-1',
  },
};
