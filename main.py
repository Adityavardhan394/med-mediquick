#!/usr/bin/env python3
"""
Cloud Functions entry point for Medical AI Backend
"""

import functions_framework
from medical_ai_backend import app

@functions_framework.http
def medical_ai_function(request):
    """HTTP Cloud Function entry point"""
    with app.test_request_context(
        path=request.path,
        method=request.method,
        headers=request.headers,
        data=request.get_data(),
        query_string=request.query_string
    ):
        return app.full_dispatch_request()

# For local development
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080) 