import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

export const dynamic = 'force-dynamic'

interface BranchInfo {
  name: string
  author: string
  files: string[]
}

interface ConflictingFile {
  file: string
  branches: string[]
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const owner = searchParams.get('owner')
  const repo = searchParams.get('repo')
  const token = searchParams.get('token')

  if (!owner || !repo || !token) {
    return NextResponse.json(
      { error: 'Missing required query params: owner, repo, token' },
      { status: 400 }
    )
  }

  try {
    const octokit = new Octokit({ auth: token })

    // Get all branches
    const { data: allBranches } = await octokit.repos.listBranches({
      owner,
      repo,
      per_page: 100,
    })

    // Filter out main/master
    const featureBranches = allBranches.filter(
      (b) => b.name !== 'main' && b.name !== 'master'
    )

    // Determine default branch (main or master)
    let baseBranch = 'main'
    const hasMain = allBranches.some((b) => b.name === 'main')
    if (!hasMain) {
      const hasMaster = allBranches.some((b) => b.name === 'master')
      if (hasMaster) baseBranch = 'master'
    }

    // For each branch, compare to base and get changed files
    const branches: BranchInfo[] = []

    for (const branch of featureBranches) {
      try {
        const { data: comparison } = await octokit.repos.compareCommits({
          owner,
          repo,
          base: baseBranch,
          head: branch.name,
        })

        const files = (comparison.files || []).map((f) => f.filename)

        // Get the latest commit author
        let author = 'unknown'
        if (comparison.commits && comparison.commits.length > 0) {
          const lastCommit = comparison.commits[comparison.commits.length - 1]
          author =
            lastCommit.author?.login ||
            lastCommit.commit?.author?.name ||
            'unknown'
        }

        branches.push({ name: branch.name, author, files })
      } catch {
        // If comparison fails (e.g., no common ancestor), skip branch
        branches.push({ name: branch.name, author: 'unknown', files: [] })
      }
    }

    // Detect conflicting files (touched by multiple branches)
    const fileMap = new Map<string, string[]>()
    for (const branch of branches) {
      for (const file of branch.files) {
        const existing = fileMap.get(file) || []
        existing.push(branch.name)
        fileMap.set(file, existing)
      }
    }

    const conflictingFiles: ConflictingFile[] = []
    for (const [file, branchNames] of fileMap.entries()) {
      if (branchNames.length > 1) {
        conflictingFiles.push({ file, branches: branchNames })
      }
    }

    return NextResponse.json({
      owner,
      repo,
      branches,
      conflictingFiles,
    })
  } catch (err: any) {
    const message = err?.message || 'Failed to fetch GitHub data'
    const status = err?.status || 500
    return NextResponse.json({ error: message }, { status })
  }
}
