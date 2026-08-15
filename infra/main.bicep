targetScope = 'subscription'

// Force re-deployment after resource group deletion
@minLength(1)
@maxLength(64)
@description('Name of the environment (e.g., dev, prod)')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('AI Agent endpoint (auto-discovered by preprovision hook)')
param aiAgentEndpoint string = ''

@description('AI Agent ID (configured via azd env set AI_AGENT_ID)')
param aiAgentId string = ''

@description('Google OAuth 2.0 Client ID (configured via azd env set GOOGLE_CLIENT_ID)')
param googleClientId string = ''

@description('Google Workspace domain allowed to sign in, enforced via the ID token hd claim')
param googleHostedDomain string = '3styk.com'

@description('Container image for web service (set by postprovision hook)')
param webImageName string = 'mcr.microsoft.com/k8se/quickstart:latest'  // Placeholder during initial provision

@description('Default tags applied by Azure Policy (optional)')
param defaultTags object = {}

var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var appTags = {
  'azd-env-name': environmentName
  'app-name': 'ai-foundry-agent'
}

var tags = union(defaultTags, appTags)

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: '${abbrs.resourcesResourceGroups}${environmentName}'
  location: location
  tags: tags
}

// Deploy infrastructure (ACR + Container Apps Environment)
module infrastructure 'main-infrastructure.bicep' = {
  name: 'infrastructure'
  scope: rg
  params: {
    location: location
    tags: tags
    resourceToken: resourceToken
  }
}

// Deploy application (Container Apps + RBAC)
module app 'main-app.bicep' = {
  name: 'app'
  scope: rg
  params: {
    location: location
    tags: tags
    resourceToken: resourceToken
    containerAppsEnvironmentId: infrastructure.outputs.containerAppsEnvironmentId
    containerRegistryName: infrastructure.outputs.containerRegistryName
    aiAgentEndpoint: aiAgentEndpoint
    aiAgentId: aiAgentId
    googleClientId: googleClientId
    googleHostedDomain: googleHostedDomain
    webImageName: webImageName
    userAssignedIdentityId: infrastructure.outputs.managedIdentityId
    managedIdentityClientId: infrastructure.outputs.managedIdentityClientId
    appInsightsConnectionString: infrastructure.outputs.appInsightsConnectionString
    appInsightsFrontendConnectionString: infrastructure.outputs.appInsightsFrontendConnectionString
  }
}

// Note: Role assignment to AI Foundry resource is done via Azure CLI in postprovision.ps1
// This avoids azd tracking the external resource group and deleting it on 'azd down'

output AZURE_CONTAINER_REGISTRY_ENDPOINT string = infrastructure.outputs.containerRegistryLoginServer
output AZURE_CONTAINER_REGISTRY_NAME string = infrastructure.outputs.containerRegistryName
output AZURE_CONTAINER_APPS_ENVIRONMENT_ID string = infrastructure.outputs.containerAppsEnvironmentId
output AZURE_RESOURCE_GROUP_NAME string = rg.name
output AZURE_CONTAINER_APP_NAME string = app.outputs.webAppName
output WEB_ENDPOINT string = app.outputs.webEndpoint
output WEB_IDENTITY_PRINCIPAL_ID string = infrastructure.outputs.managedIdentityPrincipalId
output APPLICATIONINSIGHTS_CONNECTION_STRING string = infrastructure.outputs.appInsightsConnectionString
output APPLICATIONINSIGHTS_FRONTEND_CONNECTION_STRING string = infrastructure.outputs.appInsightsFrontendConnectionString
