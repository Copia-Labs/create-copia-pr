import * as core from '@actions/core'
import { HttpClient } from '@actions/http-client'

interface CreatePullRequestPayload {
  head: string
  base: string
  title: string
  body?: string
  assignees?: string[]
  labels?: number[]
  milestone?: number
}

interface PullRequestResponse {
  number: number
  html_url: string
  message?: string
}

async function run(): Promise<void> {
  try {
    // Read required inputs
    const serverUrl = core
      .getInput('server_url', { required: true })
      .replace(/\/+$/, '')
    const token = core.getInput('token', { required: true })
    const owner = core.getInput('owner', { required: true })
    const repo = core.getInput('repo', { required: true })
    const head = core.getInput('head', { required: true })
    const base = core.getInput('base', { required: true })
    const title = core.getInput('title', { required: true })

    // Read optional inputs
    const body = core.getInput('body')
    const assignees = core.getInput('assignees')
    const labels = core.getInput('labels')
    const milestone = core.getInput('milestone')

    // Mask the token so it never appears in logs
    core.setSecret(token)

    // Build the request payload
    const payload: CreatePullRequestPayload = { head, base, title }

    if (body) {
      payload.body = body
    }

    if (assignees) {
      payload.assignees = assignees
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }

    if (labels) {
      payload.labels = labels
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))
    }

    if (milestone) {
      const milestoneId = parseInt(milestone.trim(), 10)
      if (!isNaN(milestoneId)) {
        payload.milestone = milestoneId
      }
    }

    // Create HTTP client with token auth
    const http = new HttpClient('create-copia-pr', [], {
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json'
      }
    })

    const url = `${serverUrl}/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`
    core.info(`Creating pull request: ${head} -> ${base} in ${owner}/${repo}`)

    const response = await http.postJson<PullRequestResponse>(url, payload)
    const statusCode = response.statusCode
    const result = response.result

    if (statusCode === 201 && result) {
      core.info(`Pull request #${result.number} created: ${result.html_url}`)
      core.setOutput('pull_request_number', result.number)
      core.setOutput('pull_request_url', result.html_url)
      core.setOutput('json', JSON.stringify(result))
    } else if (statusCode === 409) {
      core.setFailed(
        `A pull request already exists between '${head}' and '${base}'`
      )
    } else if (statusCode === 422) {
      const message = result?.message ?? 'unknown validation error'
      core.setFailed(`Validation failed: ${message}`)
    } else if (statusCode === 404) {
      core.setFailed(
        'Not found — verify owner, repo, branches, and token permissions'
      )
    } else if (statusCode === 401 || statusCode === 403) {
      core.setFailed(
        'Authentication failed — verify token is valid and has sufficient permissions'
      )
    } else {
      core.setFailed(`Unexpected API response: HTTP ${statusCode}`)
    }
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

run()
