# Python

## Define a targeting context accessor method

The accessor method is called from both FeatureManagement and OpenTelemetry to identify who or what the current context is.

```python
async def my_targeting_accessor() -> TargetingContext:
    session_id = ""

    if "Session-ID" in request.headers:
        session_id = request.headers["Session-ID"]

    return TargetingContext(user_id=session_id)
```

## Setup Azure Monitor/App Insights

Use one of the [Azure Monitor OpenTelemetry libraries](https://learn.microsoft.com/python/api/overview/azure/monitor-opentelemetry-readme?view=azure-python#officially-supported-instrumentations) to instrument telemetry into your application. Include the TargetingSpanProcessor if you want request and dependency data to be available for metrics.

```python
from azure.monitor.opentelemetry import configure_azure_monitor
from featuremanagement.azuremonitor import TargetingSpanProcessor

# Configure Azure Monitor
configure_azure_monitor(
    connection_string=os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING"),
    span_processors=[TargetingSpanProcessor(targeting_context_accessor=my_targeting_accessor)],
)
```

## Setup App Configuration

[Connect your application to App Configuration](https://learn.microsoft.com/azure/azure-app-configuration/quickstart-feature-flag-python#console-applications), which supplies feature flags and other configurations to your application.

```python
from azure.appconfiguration.provider import load
from azure.identity import DefaultAzureCredential

azure_app_config = load(endpoint="<your-endpoint>", credential=DefaultAzureCredential(), feature_flag_enabled=True, feature_flag_refresh_enabled=True))
```

## Use Feature Management

Finally, use the [FeatureManagement library](https://learn.microsoft.comazure/azure-app-configuration/quickstart-feature-flag-python) with telemetry enabled to evaluate the flag for the given user.

```python
from featuremanagement import FeatureManager
from featuremanagement.azuremonitor import publish_telemetry, track_event

feature_manager = FeatureManager(azure_app_config, on_feature_evaluated=publish_telemetry, targeting_context_accessor=my_targeting_accessor)

if feature_manager.get_variant("My Feature"):
    # Feature is on
else:
    # Feature is off

# Track a custom event (the user_id from the targeting context needs to be manually added here for now)
track_event("Like", my_targeting_accessor().user_id)
```
