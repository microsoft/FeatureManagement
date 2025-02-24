import os
from azure.appconfiguration.provider import load, WatchKey
from azure.identity import DefaultAzureCredential
from azure.monitor.opentelemetry import configure_azure_monitor
from featuremanagement import FeatureManager, TargetingContext
from featuremanagement.azuremonitor import TargetingSpanProcessor, publish_telemetry
from opentelemetry.baggage import  get_baggage
from pathlib import Path

ALLOWED_HOSTS = []


def my_targeting_accessor() -> TargetingContext:
    return TargetingContext(user_id=get_baggage("Session-ID"))

# Configure Azure Monitor
configure_azure_monitor(
    connection_string=os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING"),
    span_processors=[TargetingSpanProcessor(targeting_context_accessor=my_targeting_accessor)],
)

CONFIG = {}

ENDPOINT = os.environ.get("AZURE_APPCONFIG_ENDPOINT")

# Set up credentials and settings used in resolving key vault references.
credential = DefaultAzureCredential()

def callback():
    global AZURE_APP_CONFIG
    # Update Django settings with the app configuration key-values
    CONFIG.update(AZURE_APP_CONFIG)

# Load app configuration key-values
AZURE_APP_CONFIG = load(
    endpoint=ENDPOINT,
    credential=credential,
    refresh_on=[WatchKey("sentinel")],
    feature_flag_enabled=True,
    feature_flag_refresh_enabled=True,
    on_refresh_success=callback,
)

FEATURE_MANAGER = FeatureManager(AZURE_APP_CONFIG, targeting_context_accessor=my_targeting_accessor, on_feature_evaluated=publish_telemetry)


# Updates the config object with the app configuration key-values and resolved key vault reference values.
# This will override any values in the config object with the same key.
CONFIG.update(AZURE_APP_CONFIG)

SECRET_KEY = "a"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ROOT_URLCONF = "quickstartproject.urls"

MIDDLEWARE = [
'django.contrib.sessions.middleware.SessionMiddleware',
'quickstartproject.middleware.SimpleMiddleware',
]

INSTALLED_APPS = [
    "django.contrib.sessions",
]


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

