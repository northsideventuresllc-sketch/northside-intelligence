const VERCEL_API = "https://api.vercel.com";

export interface VercelDeployStatus {
  projectExists: boolean;
  isDeployed: boolean;
  projectId?: string;
  deploymentUrl?: string;
}

export async function checkVercelProjectDeployed(
  token: string,
  projectName: string
): Promise<VercelDeployStatus> {
  const projectRes = await fetch(
    `${VERCEL_API}/v9/projects/${encodeURIComponent(projectName)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (projectRes.status === 404) {
    return { projectExists: false, isDeployed: false };
  }

  if (!projectRes.ok) {
    const body = await projectRes.text();
    throw new Error(
      `Vercel project lookup failed (${projectRes.status}): ${body}`
    );
  }

  const project = (await projectRes.json()) as {
    id: string;
    name: string;
  };

  const deploymentsRes = await fetch(
    `${VERCEL_API}/v6/deployments?projectId=${project.id}&target=production&state=READY&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!deploymentsRes.ok) {
    const body = await deploymentsRes.text();
    throw new Error(
      `Vercel deployments lookup failed (${deploymentsRes.status}): ${body}`
    );
  }

  const deployments = (await deploymentsRes.json()) as {
    deployments?: Array<{ url?: string }>;
  };

  const deployment = deployments.deployments?.[0];
  return {
    projectExists: true,
    isDeployed: Boolean(deployment),
    projectId: project.id,
    deploymentUrl: deployment?.url
      ? `https://${deployment.url}`
      : undefined,
  };
}
