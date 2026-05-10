// Fill these in after running `cdk deploy` in the infra/ folder.
// The values come from the CDK Outputs printed in your terminal.
export const environment = {
  production: false,
  apiUrl: 'https://9kl9sgxof4.execute-api.us-east-1.amazonaws.com/dev/',
  cognito: {
    userPoolId: 'us-east-1_hemPkwJYx',
    userPoolClientId: '3fbml5jdbjt5ffb367ql6dhorb',
    region: 'us-east-1',
  },
};
