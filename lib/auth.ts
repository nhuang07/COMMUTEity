const COGNITO_ENDPOINT = "https://cognito-idp.us-east-1.amazonaws.com/";
const CLIENT_ID = "3vol3r2hfaci6rep17oaahtufo";

async function cognitoRequest(target: string, body: object): Promise<Record<string, unknown>> {
  const res = await fetch(COGNITO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      (data.message as string) || (data.__type as string) || "Cognito error"
    );
  }
  return data;
}

export async function signUp(email: string, password: string): Promise<void> {
  await cognitoRequest("SignUp", {
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: "email", Value: email }],
  });
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  await cognitoRequest("ConfirmSignUp", {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
}

export async function resendConfirmationCode(email: string): Promise<void> {
  await cognitoRequest("ResendConfirmationCode", {
    ClientId: CLIENT_ID,
    Username: email,
  });
}

export interface SignInResult {
  userId: string;
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const data = await cognitoRequest("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const authResult = data.AuthenticationResult as Record<string, string>;
  const idToken = authResult.IdToken;

  // Decode JWT payload (base64url → base64 → JSON)
  const b64Url = idToken.split(".")[1];
  const b64 = b64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const payload = JSON.parse(atob(padded)) as { sub: string };

  return { userId: payload.sub };
}
