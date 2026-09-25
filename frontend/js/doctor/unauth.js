async function fetchProtectedRoute(token) {
    // Show loading animation before making the request
   if (!token || !localStorage.puid){
       window.location.href = 'landing.html';
       return false
   }
   try {
       const response = await fetch('http://localhost:8000/protected-route-doctor', {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json'
           },
           body: JSON.stringify({
               puid: localStorage.puid,
               token: token
           })
       });
       const data = await response.json().catch(() => ({}));
       if (response.status === 401 || data?.message === 'Unauthorized - Missing token' || data?.message === 'send-to-logout') {
           window.location.href = 'doctorlogout.html';
       }
   } catch (error) {
       console.error('Error verifying doctor auth:', error);
   } finally {
       hideLoadingAnimation();
   }
}

function showLoadingAnimation() {
   const loadingDiv = document.createElement('div');
   loadingDiv.textContent = 'Loading...';
   loadingDiv.style.position = 'fixed';
   loadingDiv.style.top = '50%';
   loadingDiv.style.left = '50%';
   loadingDiv.style.transform = 'translate(-50%, -50%)';
   loadingDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
   loadingDiv.style.padding = '20px';
   loadingDiv.style.borderRadius = '5px';
   loadingDiv.style.zIndex = '9999';
   document.body.appendChild(loadingDiv);
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
