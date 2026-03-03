# Create Copia Pull Request

A GitHub Action that creates a pull request on a [Copia](https://app.copia.io) instance via the REST API.

Works on both Copia-hosted and self-hosted runners — only requires the Node.js runtime.

## Usage

### Minimal Example

```yaml
- uses: Copia-Labs/create-copia-pr@v1
  with:
    server_url: https://app.copia.io
    token: ${{ secrets.COPIA_TOKEN }}
    owner: my-org
    repo: my-project
    head: feature-branch
    base: main
    title: 'Automated PR from CI'
```

### Full Example

```yaml
- uses: Copia-Labs/create-copia-pr@v1
  id: create-pr
  with:
    server_url: https://app.copia.io
    token: ${{ secrets.COPIA_TOKEN }}
    owner: my-org
    repo: my-project
    head: feature-branch
    base: main
    title: 'Automated PR from CI'
    body: |
      This pull request was created automatically.

      Workflow: ${{ github.workflow }}
      Run: ${{ github.run_id }}
    assignees: alice,bob
    labels: '1,2,3'
    milestone: '5'

- name: Print PR URL
  run: echo "Created PR ${{ steps.create-pr.outputs.pull_request_url }}"
```

## Inputs

| Name         | Required | Default | Description                                                  |
| ------------ | -------- | ------- | ------------------------------------------------------------ |
| `server_url` | yes      | —       | Base URL of the Copia instance (e.g. `https://app.copia.io`) |
| `token`      | yes      | —       | Personal access token                                        |
| `owner`      | yes      | —       | Repository owner (user or organization)                      |
| `repo`       | yes      | —       | Repository name                                              |
| `head`       | yes      | —       | Source branch (or `user:branch` for cross-repo PRs)          |
| `base`       | yes      | —       | Target branch                                                |
| `title`      | yes      | —       | Pull request title                                           |
| `body`       | no       | `''`    | Pull request description                                     |
| `assignees`  | no       | `''`    | Comma-separated usernames to assign                          |
| `labels`     | no       | `''`    | Comma-separated label IDs (integers)                         |
| `milestone`  | no       | `''`    | Milestone ID (integer)                                       |

## Outputs

| Name                  | Description                                  |
| --------------------- | -------------------------------------------- |
| `pull_request_number` | The index number of the created pull request |
| `pull_request_url`    | The HTML URL of the created pull request     |
| `json`                | The full JSON API response                   |

## Error Handling

The action fails with a descriptive message for common API errors:

| HTTP Status | Meaning                                                      |
| ----------- | ------------------------------------------------------------ |
| 409         | A pull request already exists between the specified branches |
| 422         | Validation failed (e.g. head and base are the same branch)   |
| 404         | Repository, branch, or resource not found                    |
| 401/403     | Authentication or authorization failed                       |

## Development

```bash
npm install
npm run build    # bundles dist/index.js via ncc
```

The `dist/` directory is committed to the repository so the action runs without an install step.
