# ------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# -------------------------------------------------------------------------

import uuid
import os
from quart import Quart, session
from quart.sessions import SecureCookieSessionInterface
from azure.appconfiguration.provider import load
from azure.identity import DefaultAzureCredential
from azure.monitor.opentelemetry import configure_azure_monitor
from featuremanagement.aio import FeatureManager
from featuremanagement import TargetingContext
from featuremanagement.azuremonitor import TargetingSpanProcessor, track_event
from opentelemetry.baggage import set_baggage, get_baggage


# A callback for assigning a TargetingContext for both Telemetry logs and Feature Flag evaluation
async def my_targeting_accessor() -> TargetingContext:
    session_id = get_baggage("Session-ID")
    if not session_id:
        session_id = str(uuid.uuid4())
        set_baggage("Session-ID", session_id)
    return TargetingContext(user_id=session_id)


# Configure Azure Monitor
configure_azure_monitor(
    connection_string=os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING"),
    span_processors=[TargetingSpanProcessor(targeting_context_accessor=my_targeting_accessor)],
)

app = Quart(__name__)
app.session_interface = SecureCookieSessionInterface()
app.secret_key = os.urandom(24)

endpoint = os.environ.get("APPCONFIGURATION_ENDPOINT_STRING")
credential = DefaultAzureCredential()

# Connecting to Azure App Configuration using AAD
config = load(endpoint=endpoint, credential=credential, feature_flag_enabled=True, feature_flag_refresh_enabled=True)

# Load feature flags and set up targeting context accessor
feature_manager = FeatureManager(config, targeting_context_accessor=my_targeting_accessor)

@app.route("/")
async def hello():
    track_event("index", session["Session-ID"])
    return str(feature_manager.is_enabled("Beta"))


app.run()
