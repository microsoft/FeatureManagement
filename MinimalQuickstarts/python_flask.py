# ------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# -------------------------------------------------------------------------
import os
import uuid
from azure.appconfiguration.provider import load
from azure.identity import DefaultAzureCredential
from azure.monitor.opentelemetry import configure_azure_monitor
from featuremanagement import FeatureManager, TargetingContext
from featuremanagement.azuremonitor import TargetingSpanProcessor, track_event, publish_telemetry
from opentelemetry import trace
from opentelemetry.trace import get_tracer_provider
from opentelemetry.baggage import set_baggage, get_baggage

def my_targeting_accessor() -> TargetingContext:
    session_id = get_baggage("Session-ID")
    if not session_id:
        session_id = str(uuid.uuid4())
        set_baggage("Session-ID", session_id)
        set_baggage("Groups", ["Beta, Alpha"])
    return TargetingContext(user_id=session_id)

# Configure Azure Monitor
configure_azure_monitor(
    connection_string=os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING"),
    span_processors=[TargetingSpanProcessor(targeting_context_accessor=my_targeting_accessor)],
)

tracer = trace.get_tracer(__name__, tracer_provider=get_tracer_provider())

from flask import Flask, make_response, session, request
from flask.sessions import SecureCookieSessionInterface

app = Flask(__name__)
app.session_interface = SecureCookieSessionInterface()
app.secret_key = os.urandom(24)

ENDPOINT = os.environ.get("AZURE_APPCONFIG_ENDPOINT")
credential = DefaultAzureCredential()

global azure_app_config, feature_manager
azure_app_config = load(
    endpoint=ENDPOINT,
    credential=credential,
    feature_flag_enabled=True,
    feature_flag_refresh_enabled=True,
)

feature_manager = FeatureManager(azure_app_config, targeting_context_accessor=my_targeting_accessor, on_feature_evaluated=publish_telemetry)
app.config.update(azure_app_config)

@app.route("/")
def index():
    global azure_app_config
    # Refresh the configuration from App Configuration service.
    azure_app_config.refresh()
    response = make_response(str(feature_manager.is_enabled("Beta")))
    response.mimetype = "text/plain"
    track_event("index", get_baggage("Session-ID"))

    return response

if __name__ == "__main__":
    app.run()