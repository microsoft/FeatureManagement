# Variables
$resourceGroupName = $env:RESOURCE_GROUP_NAME
$subscriptionId = $env:AZURE_SUBSCRIPTION_ID

if (-not $resourceGroupName) {
    Write-Error "Environment variable RESOURCE_GROUP_NAME is not set."
    exit 1
}

if (-not $subscriptionId) {
    Write-Error "Environment variable AZURE_SUBSCRIPTION_ID is not set."
    exit 1
}

$templateFile = "azuredeploy.json"
$deploymentName = "appConfigDeployment"

Set-AzContext -SubscriptionId $subscriptionId

# Deploy the ARM template
# Check if the resource group exists
$resourceGroup = Get-AzResourceGroup -Name $resourceGroupName -ErrorAction SilentlyContinue

if (-not $resourceGroup) {
    Write-Error "Resource group '$resourceGroupName' does not exist."
    exit 1
}

# Deploy the ARM template
New-AzResourceGroupDeployment -ResourceGroupName $resourceGroupName -TemplateFile $templateFile -Name $deploymentName

# Get the output from the deployment
$appConfigName = (Get-AzResourceGroupDeployment -ResourceGroupName $resourceGroupName -Name $deploymentName).Outputs.appConfigName.value

# Get the connection string
$connectionString = Get-AzAppConfigurationStoreKey -Name $appConfigName -ResourceGroupName $resourceGroupName


# Output the connection string
Write-Output "App Configuration Name: $appConfigName"
Write-Output "Connection String: $connectionString"