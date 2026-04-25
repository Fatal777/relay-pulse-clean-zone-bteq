import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware, getCurrentUserId } from 'lyzr-architect'
import { Octokit } from '@octokit/rest'
import getBranchModel from '@/models/Branch'
import getGithubSettingModel from '@/models/GithubSetting'
import getPulseEventModel from '@/models/PulseEvent'

export const dynamic = 'force-dynamic'

// ── Helpers ──────────────────────────────────────────────────────────────────

function inferKind(branchName: string): 'feature' | 'fix' | 'chore' | 'refactor' {
  const n = branchName.toLowerCase()
  if (n.startsWith('fix/') || n.startsWith('bugfix/') || n.startsWith('hotfix/')) return 'fix'
  if (n.startsWith('chore/') || n.startsWith('build/') || n.startsWith('deps/') || n.startsWith('ci/')) return 'chore'
  if (n.startsWith('refactor/') || n.startsWith('refact/') || n.startsWith('cleanup/')) return 'refactor'
  return 'feature'
}

function inferStatus(branchName: string, openPRBranches: Set<string>): 'active' | 'review' | 'merged' | 'abandoned' {
  if (openPRBranches.has(branchName)) return 'review'
  return 'active'
}

// ── GET /api/branches — list all branch sessions ──────────────────────────────
async function handleGet() {
  try {
    const Branch = await getBranchModel()
    const branches = await Branch.find({}).sort({ last_synced_at: -1 })
    return NextResponse.json({ success: true, data: branches })
  } catch (err: any) {
    console.error('[GET /api/branches]', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// ── POST /api/branches — sync from GitHub and upsert branch records ───────────
async function handlePost(req: NextRequest) {
  try {
    const userId = getCurrentUserId()

    // Load GitHub settings
    const GithubSetting = await getGithubSettingModel()
    const settings = await GithubSetting.findOne({})
    if (!settings?.repo_owner || !settings?.repo_name) {
      return NextResponse.json({ success: false, error: 'No GitHub repo configured. Set it in Settings first.' }, { status: 400 })
    }

    const { repo_owner: owner, repo_name: repo, github_token_ref: token } = settings

    if (!token) {
      return NextResponse.json({ success: false, error: 'No GitHub token configured.' }, { status: 400 })
    }

    const octokit = new Octokit({ auth: token })

    // 1. Get all branches
    const { data: allBranches } = await octokit.repos.listBranches({ owner, repo, per_page: 100 })
    const featureBranches = allBranches.filter((b) => b.name !== 'main' && b.name !== 'master')

    // Determine default branch
    const baseBranch = allBranches.some((b) => b.name === 'main') ? 'main' : 'master'

    // 2. Get open PRs to determine which branches are in review
    const { data: openPRs } = await octokit.pulls.list({ owner, repo, state: 'open', per_page: 50 })
    const openPRBranches = new Set(openPRs.map((pr) => pr.head.ref))
    const prByBranch = new Map(openPRs.map((pr) => [pr.head.ref, { number: pr.number, title: pr.title, url: pr.html_url }]))

    // 3. Get changed files per branch (parallel, max 10)
    const branchData: { name: string; author: string; files: string[] }[] = []

    const chunks: typeof featureBranches[] = []
    for (let i = 0; i < featureBranches.length; i += 10) {
      chunks.push(featureBranches.slice(i, i + 10))
    }

    for (const chunk of chunks) {
      const results = await Promise.allSettled(
        chunk.map(async (b) => {
          try {
            const { data: comparison } = await octokit.repos.compareCommits({
              owner, repo, base: baseBranch, head: b.name,
            })
            const files = (comparison.files ?? []).map((f) => f.filename)
            const commits = comparison.commits ?? []
            const lastCommit = commits[commits.length - 1]
            const author = lastCommit?.author?.login || lastCommit?.commit?.author?.name || 'unknown'
            return { name: b.name, author, files }
          } catch {
            return { name: b.name, author: 'unknown', files: [] }
          }
        })
      )
      results.forEach((r) => {
        if (r.status === 'fulfilled') branchData.push(r.value)
      })
    }

    // 4. Detect conflicting files
    const fileMap: Record<string, string[]> = {}
    for (const b of branchData) {
      for (const file of b.files) {
        if (!fileMap[file]) fileMap[file] = []
        fileMap[file].push(b.name)
      }
    }
    const conflictingBranches = new Set<string>()
    for (const names of Object.values(fileMap)) {
      if (names.length > 1) names.forEach((n) => conflictingBranches.add(n))
    }

    // 5. Upsert branch records in MongoDB
    const Branch = await getBranchModel()
    const savedBranches: any[] = []

    for (const b of branchData) {
      const pr = prByBranch.get(b.name)
      const doc: any = await Branch.findOneAndUpdate(
        { owner_user_id: userId, repo_owner: owner, repo_name: repo, branch_name: b.name },
        {
          $set: {
            owner_user_id:  userId,
            repo_owner:     owner,
            repo_name:      repo,
            branch_name:    b.name,
            kind:           inferKind(b.name),
            status:         inferStatus(b.name, openPRBranches),
            github_author:  b.author,
            hasConflict:    conflictingBranches.has(b.name),
            changed_files:  b.files.slice(0, 100),
            pr_number:      pr?.number,
            pr_title:       pr?.title,
            pr_url:         pr?.url,
            last_synced_at: new Date(),
          },
        },
        { upsert: true, new: true }
      )
      savedBranches.push(doc)
    }

    // 6. Emit a pulse event for the sync
    try {
      const PulseEvent = await getPulseEventModel()
      await PulseEvent.create({
        owner_user_id: userId,
        kind:          'branch_synced',
        actor:         { name: 'You' },
        payload:       { count: savedBranches.length, repo: `${owner}/${repo}` },
      })
    } catch { /* non-fatal */ }

    return NextResponse.json({ success: true, data: savedBranches })
  } catch (err: any) {
    console.error('[POST /api/branches]', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export const GET  = authMiddleware(handleGet)
export const POST = authMiddleware(handlePost)
