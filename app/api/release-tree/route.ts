export const dynamic = 'force-dynamic';

export async function GET() {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (!commitSha) {
    return Response.json({ error: 'Missing VERCEL_GIT_COMMIT_SHA' }, { status: 503 });
  }

  const response = await fetch(
    `https://api.github.com/repos/vlad40000/Tattoo-prehab/commits/${commitSha}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'tattoo-prehab-release-tree',
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    return Response.json(
      { error: 'GitHub commit lookup failed', status: response.status },
      { status: 502 },
    );
  }

  const commit = (await response.json()) as {
    sha?: string;
    commit?: { tree?: { sha?: string } };
  };

  return Response.json({ commitSha: commit.sha, treeSha: commit.commit?.tree?.sha });
}
