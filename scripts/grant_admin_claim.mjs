function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function grantAdminClaim() {
  const accessToken = getRequiredEnv('GOOGLE_OAUTH_ACCESS_TOKEN');
  const projectId = getRequiredEnv('FIREBASE_PROJECT_ID');
  const targetUid = getRequiredEnv('TARGET_UID');
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts:update`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customAttributes: JSON.stringify({ admin: true }),
        localId: targetUid,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Granting admin claim failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  console.log(
    JSON.stringify(
      {
        admin: true,
        localId: payload.localId || targetUid,
        projectId,
      },
      null,
      2
    )
  );
}

await grantAdminClaim();
