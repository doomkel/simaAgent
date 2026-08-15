# Azure Developer CLI Hooks

**AI Assistance**: See `.github/skills/deploying-to-azure/SKILL.md` for deployment patterns.

## Hook Execution Order

| Phase | Command | Hooks Executed | Duration |
|-------|---------|----------------|----------|
| **Deploy** | `azd up` | preprovision → provision → postprovision → predeploy | 10-12 min |
| **Code Only** | `azd deploy` | predeploy | 3-5 min |
| **Teardown** | `azd down` | (resources deleted) → postdown | 2-3 min |
| **Reprovision** | `azd provision` | preprovision → provision → postprovision | 2-3 min |

## Logging

All hooks start a PowerShell transcript automatically and write logs to `.azure/<env>/logs/` with timestamped filenames (one per hook run). The transcript captures the same console output shown during `azd` execution for post-run troubleshooting.

## Hook Details

| Hook | Purpose | Key Actions | Outputs |
|------|---------|-------------|---------|
| **preprovision.ps1** | Discover AI Foundry + configure agent | • Discovers AI Foundry resources<br>• Validates `GOOGLE_CLIENT_ID` is set<br>• Discovers agent in project | AI Foundry env vars |
| **postprovision.ps1** | RBAC + local config | • Assigns `Cognitive Services OpenAI Contributor` + `Azure AI Developer` roles to AI Foundry<br>• Generates local dev config files (`.env`, `.env.local`) with Google OAuth vars | RBAC + local config |
| **predeploy.ps1** | Build container image | • Detects Docker availability<br>• Passes `GOOGLE_CLIENT_ID`, `GOOGLE_HOSTED_DOMAIN`, `APPLICATIONINSIGHTS_FRONTEND_CONNECTION_STRING` as Docker build args<br>• Local Docker build + push OR ACR cloud build<br>• Updates Container App if it exists | Container image in ACR |
| **postdown.ps1** | Cleanup (optional) | • Removes RBAC assignment<br>• Optionally removes Docker images | Clean slate |

## Google OAuth Setup

Unlike Entra ID, the Google OAuth Client ID **cannot be created by Bicep** — it belongs to a Google Cloud project, not Azure. Before running `azd up`:

1. Create an OAuth 2.0 Client ID (Web application) at [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add `http://localhost:5173` as an authorized JavaScript origin for local dev.
3. Run `azd env set GOOGLE_CLIENT_ID <client-id>`.
4. After `azd up` completes, add the printed `WEB_ENDPOINT` URL as an additional authorized JavaScript origin.

The backend enforces the `3styk.com` Workspace domain via the `hd` claim on the Google ID token (override with `azd env set GOOGLE_HOSTED_DOMAIN <domain>`).

## Module Scripts

### modules/Get-AIFoundryAgents.ps1

Discovers agents in a Microsoft Foundry project via REST API (`/agents?api-version=2025-11-15-preview`).

**Usage**:
```powershell
# Basic usage
$agents = & "$PSScriptRoot/modules/Get-AIFoundryAgents.ps1" `
    -ProjectEndpoint $endpoint

# Quiet mode (suppress console output)
$agents = & "$PSScriptRoot/modules/Get-AIFoundryAgents.ps1" `
    -ProjectEndpoint $endpoint -Quiet

# Custom token
$agents = & "$PSScriptRoot/modules/Get-AIFoundryAgents.ps1" `
    -ProjectEndpoint $endpoint -AccessToken $token
```

**Returns**: Array of agent objects (`name`, `id`, `versions`). Handles pagination automatically.

## Testing

```powershell
# Test individual hooks
.\hooks\preprovision.ps1
.\hooks\postprovision.ps1  # Requires provisioned infrastructure
.\hooks\postdown.ps1

# Test full flow
azd up
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Preprovision fails: `GOOGLE_CLIENT_ID not set` | Run `azd env set GOOGLE_CLIENT_ID <client-id>` (see Google OAuth Setup above) |
| Provision fails | Verify Azure CLI auth: `az account show` |
| Predeploy Docker build fails | Check Docker running: `docker version` (falls back to ACR cloud build) |
| AI Foundry not found | Create resource at [ai.azure.com](https://ai.azure.com) or use [foundry-samples Bicep templates](https://github.com/microsoft-foundry/foundry-samples/tree/main/infrastructure/infrastructure-setup-bicep) |
| Multiple AI Foundry resources | Set `AI_FOUNDRY_RESOURCE_NAME` or select when prompted |
| RBAC assignment fails | Verify you have User Access Administrator role on AI Foundry resource |
| Sign-in fails with `redirect_uri_mismatch` or origin error | Add the app's URL as an authorized JavaScript origin for the Client ID in Google Cloud Console |

### Multiple AI Foundry Resources

If you have multiple AI Foundry resources in your subscription, the preprovision hook will prompt you to select one. 

**To skip the prompt**, pre-configure your preferred resource:
```powershell
azd env set AI_FOUNDRY_RESOURCE_NAME "your-ai-foundry-resource-name"
```

## Customization

### Change Default Behavior

| Change | File | Modification |
|--------|------|-------------|
| Always clean Docker images | `postdown.ps1` | Set `$cleanDockerImages = $true` |
| Change ports | `start-local-dev.ps1` + Google Cloud Console authorized origins | Update port references |
| Skip auto-opening browser | `postprovision.ps1` | Comment out `Start-Process` line |

## See Also

- `.github/hooks/` — Copilot agent hooks (commit gate, custom workflow policies). These are **different** from the azd deployment hooks in this directory.
