from opentelemetry.baggage import set_baggage
from opentelemetry.context import attach
from opentelemetry.trace import get_current_span

class SimpleMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        attach(set_baggage("Session-ID", request.session.session_key))
        attach(set_baggage("Groups", ["Beta, Alpha"]))

        get_current_span().set_attribute("TargetingId", request.session.session_key)

        response = self.get_response(request)

        return response