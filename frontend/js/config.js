/**
 * PsyShell - Student Stress & Coping Mechanisms Portal
 * Global API and Connection Configuration
 */
(function () {
    const origin = (typeof window !== 'undefined' && window.location.protocol.startsWith('http'))
        ? window.location.origin
        : 'http://localhost:8000';

    window.API_BASE = origin;
    window.API_BASE_URL = origin;

    // Axios interceptor to ensure all requests routed to http://localhost:8000 are dynamically adapted if hosted on another port or domain
    if (typeof axios !== 'undefined') {
        axios.interceptors.request.use(function (config) {
            if (config.url && config.url.includes('http://localhost:8000') && origin !== 'http://localhost:8000') {
                config.url = config.url.replace('http://localhost:8000', origin);
            }
            return config;
        });
    }

    // Fetch wrapper
    if (typeof window !== 'undefined' && window.fetch) {
        const originalFetch = window.fetch;
        window.fetch = function (url, options) {
            if (typeof url === 'string' && url.includes('http://localhost:8000') && origin !== 'http://localhost:8000') {
                url = url.replace('http://localhost:8000', origin);
            }
            return originalFetch(url, options);
        };
    }
})();
