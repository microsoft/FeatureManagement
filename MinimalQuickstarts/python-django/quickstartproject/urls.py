from django.urls import path
from django.http import HttpResponse
from django.conf import settings
from opentelemetry.baggage import get_baggage
from featuremanagement.azuremonitor import track_event


async def index(request):
    # Refresh the configuration from App Configuration service.
    settings.AZURE_APP_CONFIG.refresh()
    track_event("index", request.session.session_key)

    return HttpResponse(str(settings.FEATURE_MANAGER.is_enabled("Beta")))


urlpatterns = [
    path('', index, name='index'),
]
