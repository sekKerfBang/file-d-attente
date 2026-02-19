import time
from prometheus_client import Histogram, Counter
from django.utils.deprecation import MiddlewareMixin

request_duration = Histogram(
    'django_http_request_duration_seconds',
    'Durée des requêtes HTTP',
    ['method', 'endpoint', 'status']
)

request_total = Counter(
    'django_http_requests_total',
    'Total des requêtes HTTP',
    ['method', 'endpoint', 'status']
)

active_requests = Gauge(
    'django_http_requests_active',
    'Requêtes HTTP actives'
)

class MetricsMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request._start_time = time.time()
        active_requests.inc()
        
    def process_response(self, request, response):
        if hasattr(request, '_start_time'):
            duration = time.time() - request._start_time
            endpoint = request.resolver_match.route if request.resolver_match else 'unknown'
            
            labels = {
                'method': request.method,
                'endpoint': endpoint,
                'status': response.status_code
            }
            
            request_duration.observe(duration)
            request_total.inc()
            active_requests.dec()
            
        return response