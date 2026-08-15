#!/usr/bin/env pwsh
# Post-provision: Assigns RBAC and generates local dev config
# Google OAuth Client ID is user-provided (azd env set GOOGLE_CLIENT_ID); no Entra app to configure.

$ErrorActionPreference = "Stop"
. "$PSScriptRoot/modules/HookLogging.ps1"
Start-HookLog -HookName "postprovision" -EnvironmentName $env:AZURE_ENV_NAME

Write-Host "Post-Provision: RBAC & Local Config" -ForegroundColor Cyan

$googleClientId = azd env get-value GOOGLE_CLIENT_ID 2>$null
$googleHostedDomain = azd env get-value GOOGLE_HOSTED_DOMAIN 2>$null
$containerAppUrl = azd env get-value WEB_ENDPOINT 2>$null
$webIdentityPrincipalId = azd env get-value WEB_IDENTITY_PRINCIPAL_ID 2>$null
$aiFoundryResourceGroup = azd env get-value AI_FOUNDRY_RESOURCE_GROUP 2>$null
$aiFoundryResourceName = azd env get-value AI_FOUNDRY_RESOURCE_NAME 2>$null
$subscriptionId = azd env get-value AZURE_SUBSCRIPTION_ID 2>$null

if (-not $googleClientId) {
    Write-Host "[ERROR] GOOGLE_CLIENT_ID not set (run: azd env set GOOGLE_CLIENT_ID <client-id>)" -ForegroundColor Red
    exit 1
}
if (-not $containerAppUrl) {
    Write-Host "[ERROR] WEB_ENDPOINT not set" -ForegroundColor Red
    exit 1
}
if (-not $googleHostedDomain) {
    $googleHostedDomain = "3styk.com"
}

Write-Host "[OK] Google Client ID: $googleClientId" -ForegroundColor Green
Write-Host "[OK] Container App: $containerAppUrl" -ForegroundColor Green
Write-Host "[REMINDER] Add '$containerAppUrl' as an authorized JavaScript origin for this Client ID in Google Cloud Console" -ForegroundColor Yellow
# - Cognitive Services User: wildcard data action (covers AIServices/agents/*)
# - Cognitive Services OpenAI Contributor: model access, conversations (OpenAI/*)
# - Azure AI Developer: v2 agents API (SpeechServices, ContentSafety, MaaS)
# Done via CLI (not Bicep) to prevent azd from tracking the external resource group
if ($webIdentityPrincipalId -and $aiFoundryResourceGroup -and $aiFoundryResourceName -and $subscriptionId) {
    Write-Host "Assigning AI Foundry RBAC roles to web app identity..." -ForegroundColor Yellow
    
    $scope = "/subscriptions/$subscriptionId/resourceGroups/$aiFoundryResourceGroup/providers/Microsoft.CognitiveServices/accounts/$aiFoundryResourceName"
    
    $roles = @("Cognitive Services User", "Cognitive Services OpenAI Contributor", "Azure AI Developer")
    foreach ($roleName in $roles) {
        $existingAssignment = az role assignment list `
            --assignee $webIdentityPrincipalId `
            --role $roleName `
            --scope $scope 2>$null | ConvertFrom-Json
        
        if ($existingAssignment -and $existingAssignment.Count -gt 0) {
            Write-Host "[OK] $roleName — already assigned" -ForegroundColor Green
        } else {
            az role assignment create `
                --assignee-object-id $webIdentityPrincipalId `
                --assignee-principal-type ServicePrincipal `
                --role $roleName `
                --scope $scope | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] $roleName — assigned" -ForegroundColor Green
            } else {
                Write-Host "[WARN] $roleName — failed (you may need to assign manually)" -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "[SKIP] AI Foundry role assignment - missing configuration" -ForegroundColor Yellow
    Write-Host "  Set AI_FOUNDRY_RESOURCE_GROUP and AI_FOUNDRY_RESOURCE_NAME environment variables" -ForegroundColor Gray
}

# Generate local dev config files
$aiAgentEndpoint = azd env get-value AI_AGENT_ENDPOINT 2>$null
$aiAgentId = azd env get-value AI_AGENT_ID 2>$null
$aiAgentVersion = azd env get-value AI_AGENT_VERSION 2>$null

# Frontend .env.local
$frontendEnv = @"
# Auto-generated - Do not commit
VITE_GOOGLE_CLIENT_ID=$googleClientId
VITE_GOOGLE_HOSTED_DOMAIN=$googleHostedDomain
"@
$frontendEnv | Out-File -FilePath "frontend/.env.local" -Encoding utf8 -Force

# Backend .env
$backendEnvContent = @"
# Auto-generated - Do not commit
GOOGLE_CLIENT_ID=$googleClientId
GOOGLE_HOSTED_DOMAIN=$googleHostedDomain
AI_AGENT_ENDPOINT=$aiAgentEndpoint
AI_AGENT_ID=$aiAgentId
"@
if ($aiAgentVersion) {
    $backendEnvContent += "`nAI_AGENT_VERSION=$aiAgentVersion"
}
$backendEnvContent | Out-File -FilePath "backend/WebApp.Api/.env" -Encoding utf8 -Force

Write-Host "[OK] Local dev config created" -ForegroundColor Green

# Open browser
try { Start-Process $containerAppUrl } catch { }

Write-Host "[OK] Post-provision complete. URL: $containerAppUrl" -ForegroundColor Green

if ($script:HookLogFile) {
    Write-Host "[LOG] Log file: $script:HookLogFile" -ForegroundColor DarkGray
}
Stop-HookLog
