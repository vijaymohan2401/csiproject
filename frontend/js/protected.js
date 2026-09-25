async function fetchProtectedRoute(token) {
     // Show loading animation before making the request
     showLoadingAnimation();
    if (!token || !localStorage.uid){
        window.location.href = 'landing.html';
        return false
    }
    try {
        const response = await fetch('http://localhost:8000/protected-route-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uid: localStorage.uid,
                token: token
            })
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401 || data?.message === 'Unauthorized - Missing token' || data?.message === 'send-to-logout') {
            window.location.href = 'landing.html';
        }
    } catch (error) {
        console.error('Error verifying user auth:', error);
    } finally {
        hideLoadingAnimation();
    }
}

function showLoadingAnimation() {
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('loading-div');
    loadingDiv.textContent = 'Loading...';
    loadingDiv.style.position = 'fixed';
    loadingDiv.style.top = '50%';
    loadingDiv.style.left = '50%';
    loadingDiv.style.transform = 'translate(-50%, -50%)';
    loadingDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    loadingDiv.style.padding = '20px';
    loadingDiv.style.borderRadius = '5px';
    loadingDiv.style.zIndex = '9999';
    document.head.appendChild(loadingDiv);
}

// Function to remove loading animation
function hideLoadingAnimation() {
    const loadingDiv = document.querySelector('.loading-div');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Example usage:
// Assuming you have a function to get the token, such as getToken()
fetchProtectedRoute(localStorage.token); // Call the function to fetch the protected route
