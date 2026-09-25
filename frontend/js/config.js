/**
 * PsyShell - Student Stress & Coping Mechanisms Portal
 * Global API and Connection Configuration
 */
(function () {
    const origin = 'https://csiproject-1.onrender.com';

    window.API_BASE = origin;
    window.API_BASE_URL = origin;

    // Axios interceptor
    if (typeof axios !== 'undefined') {
        axios.interceptors.request.use(function (config) {
            if (config.url && config.url.includes('http://localhost:8000')) {
                config.url = config.url.replace('http://localhost:8000', origin);
            }
            return config;
        });
    }

    // Fetch wrapper
    if (typeof window !== 'undefined' && window.fetch) {
        const originalFetch = window.fetch;

        window.fetch = function (url, options) {
            if (typeof url === 'string' && url.includes('http://localhost:8000')) {
                url = url.replace('http://localhost:8000', origin);
            }
            return originalFetch(url, options);
        };
    }
})();