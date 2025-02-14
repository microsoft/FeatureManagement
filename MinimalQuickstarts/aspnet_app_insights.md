# ASP.NET

## Setup Azure Monitor/App Insights

[Setup Application Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/app/asp-net-core) to instrument telemetry into your application.

```dotnet
builder.Services.AddApplicationInsightsTelemetry();
```

## Setup App Configuration

[Connect your application to App Configuration](https://learn.microsoft.com/en-us/azure/azure-app-configuration/quickstart-aspnet-core-app?tabs=entra-id), which supplies feature flags and other configurations to your application.
```dotnet
builder.Configuration.AddAzureAppConfiguration(options =>
{
    options.Connect(new Uri(endpoint), new DefaultAzureCredential());
});
```

## Setup Feature Management

Add Feature Management to the service collection and add the targeting middleware. [Learn More](https://learn.microsoft.com/en-us/azure/azure-app-configuration/quickstart-feature-flag-aspnet-core#use-a-feature-flag)

```dotnet
builder.Services.AddFeatureManagement()
    .WithTargeting()
    .AddApplicationInsightsTelemetry();
 
app.UseMiddleware<TargetingHttpContextMiddleware>();
```

## Use Feature Management

Use DI to retrieve the FeatureManager, and get the assigned variant of the feature flag for the user. Use DI to get an instance of `FeatureManager` for flag data and `TelemetryClient` for custom events.

```dotnet
Variant variant = await _featureManager
    .GetVariantAsync("MyFeatureFlag", HttpContext.RequestAborted);

telemetryClient.TrackEvent("checkout");
```