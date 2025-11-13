// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
    
    // ==================== LOGIN PAGE ====================
    const loginForm = document.querySelector("#login-card form");
    
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            handleGoogleLogin();
        });
    }
    
    // ==================== VERIFICATION PAGE ====================
    const verificationForm = document.getElementById("verification-form");

    // Check if we're on verification page and have user data in session
    if (verificationForm) {
        checkUserSession();
        
        verificationForm.addEventListener("submit", (e) => {
            e.preventDefault();
            handleVerification();
        });
    }
    // ==================== REQUEST ACCESS PAGE ====================
    // USER EMAIL DISPLAY
    // Load user email on any page that needs it
    const userEmailDisplay = document.getElementById("user-email-display");
    if (userEmailDisplay) {
        loadUserEmail();
    }

    // LOGOUT FUNCTIONALITY
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });
    }

    // ==================== ACCESS REQUEST FORM PAGE ====================
    const accessRequestForm = document.getElementById("access-request-form");
    if (accessRequestForm) {
        accessRequestForm.addEventListener("submit", (e) => {
            e.preventDefault();
            handleAccessRequest();
        });
    }
});

// ==================== LOGIN FUNCTIONS ====================

/**
 * Handle Google OAuth login
 * Redirects to Google OAuth endpoint
 * After OAuth, backend will store user in DB and session
 */
function handleGoogleLogin() {
    console.log("Google login button clicked");
    // Redirect to Google OAuth - backend handles user creation/login
    window.location.href = "/auth/google";
    
    // TODO: Bring in Backend functionality
}

/**
 * Check if user session exists and fetch user data
 * Called on verification page load
 */
async function checkUserSession() {
    try {
        // Try to get current session user info from backend
        const response = await fetch("/auth/session", {
            credentials: "include" // Include session cookie
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.user && data.user.email) {
                displayUserInfo(data.user);
            }
        }
    } catch (error) {
        console.error("Error fetching user session:", error);
    }
}

/**
 * Display user information on verification page
 */
function displayUserInfo(user) {
    // Display user email or name if you have a placeholder in the UI
    console.log("Logged in user:", user);
    // You can update DOM elements here to show user info
    // Example: document.getElementById("user-email").textContent = user.email;
}

// ==================== VERIFICATION FUNCTIONS ====================

/**
 * Handle verification code submission
 */
async function handleVerification() {
    const codeInput = document.getElementById("verification-code");
    const code = codeInput.value.trim();
    
    // Validate input
    if (!code) {
        showMessage("Please enter a verification code");
        return;
    }
    
    console.log("Verifying code:", code);
    
    try {
        // First, get user session to check email
        const sessionResponse = await fetch("/auth/session", {
            credentials: "include"
        });
        
        if (!sessionResponse.ok) {
            showMessage("Session expired. Please log in again.");
            window.location.href = "/";
            return;
        }
        
        const sessionData = await sessionResponse.json();
        const isUCSDEmail = sessionData.user.email.endsWith("@ucsd.edu");
        
        if (!isUCSDEmail) {
            // Non-UCSD user -> redirect to request access
            window.location.href = "/auth/request-access";
            return;
        }

        // Call backend to verify code and create user
        const response = await fetch("/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Verification successful, redirect to dashboard
            window.location.href = "/dashboard";
        } else {
            // Verification failed
            showMessage(data.error || "Invalid verification code");
        }
        
    } catch (error) {
        console.error("Error during verification:", error);
        showMessage("Verification failed. Please try again.");
    }
}

// ==================== REQUEST ACCESS FUNCTIONS ====================

/**
 * Load and display user's email from session
 */
async function loadUserEmail() {
    try {
        const response = await fetch('/auth/session', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.user && data.user.email) {
                const emailDisplay = document.getElementById('user-email-display');
                if (emailDisplay) {
                    emailDisplay.innerHTML = `
                        <p class="response-txt">
                            You signed in with:
                        </p>
                        <output class="email-display">${data.user.email}</output>
                    `;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching user session:', error);
    }
}

/**
 * Handle user logout
 */
function logout() {
    fetch('/logout', {
        method: 'GET',
        credentials: 'include'
    }).then(() => {
        window.location.href = '/';
    }).catch((error) => {
        console.error('Error during logout:', error);
    });
}

// ==================== ACCESS REQUEST FORM FUNCTIONS ====================

/**
 * Handle access request form submission
 */
async function handleAccessRequest() {
    // Get form data
    const formData = {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        email: document.getElementById('email').value,
        institution: document.getElementById('institution').value
    };
    
    console.log("Submitting access request:", formData);
    
    // TODO: Send form data to backend API
    // Example:
    // try {
    //     const response = await fetch('/api/access-request', {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         credentials: 'include',
    //         body: JSON.stringify(formData)
    //     });
    //     
    //     if (response.ok) {
    //         showSuccessMessage();
    //     } else {
    //         showMessage("Failed to submit access request. Please try again.");
    //     }
    // } catch (error) {
    //     console.error('Error submitting access request:', error);
    //     showMessage("An error occurred. Please try again.");
    // }
    
    // For now, just show success message
    showSuccessMessage();
}

/**
 * Show success message after form submission
 */
function showSuccessMessage() {
    const container = document.querySelector('.container');
    
    container.innerHTML = `
        <figure class="icon" aria-label="Success icon" style="background: #48bb78;">✓</figure>
        <h1 class="page-title">Request Submitted</h1>
        <p class="message">
            Your access request has been sent to the system administrator. 
            You will get a notification once your account has been approved.
        </p>
        <nav class="button-group">
            <button onclick="logout()" class="btn btn-primary">Return to Login</button>
        </nav>
    `;
}
// ==================== UTILITY FUNCTIONS ====================

/**
 * Show error message
 */
function showMessage(message) {
    alert("Error: " + message);
    // TODO: Replace with better UI notification
    console.log(message);
}