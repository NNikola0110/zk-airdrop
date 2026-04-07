export async function checkIfUserIsContributor(
  githubLogin: string,
  repoOwner: string,
  repoName: string
): Promise<boolean> {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contributors`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "zk-airdrop-local",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub contributors request failed with status ${response.status}`
    );
  }

  const contributors = (await response.json()) as Array<{
    login?: string;
    [key: string]: unknown;
  }>;

  return contributors.some(
    (contributor) =>
      contributor.login?.toLowerCase() === githubLogin.toLowerCase()
  );
}
