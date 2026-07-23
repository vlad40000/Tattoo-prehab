export const dynamic = 'force-dynamic';

export async function GET() {
  const response = await fetch(
    'https://api.github.com/repos/vlad40000/Tattoo-prehab/actions/runs?per_page=10',
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'tattoo-prehab-release-actions',
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    return Response.json(
      { error: 'GitHub Actions lookup failed', status: response.status },
      { status: 502 },
    );
  }

  const data = (await response.json()) as {
    workflow_runs?: Array<{
      id: number;
      name: string;
      event: string;
      status: string;
      conclusion: string | null;
      head_sha: string;
      head_branch: string;
      html_url: string;
      run_number: number;
    }>;
  };

  return Response.json({
    runs: (data.workflow_runs ?? []).map((run) => ({
      id: run.id,
      name: run.name,
      event: run.event,
      status: run.status,
      conclusion: run.conclusion,
      headSha: run.head_sha,
      headBranch: run.head_branch,
      runNumber: run.run_number,
      url: run.html_url,
    })),
  });
}
