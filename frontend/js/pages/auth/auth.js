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
    const verificationCodeInput = document.getElementById("verification-code");

    // Check if we're on verification page and have user data in session
    if (verificationForm) {
        checkUserSession();
        
        verificationForm.addEventListener("submit", (e) => {
            e.preventDefault();
            handleVerification();
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
                // Check if UCSD email
                const isUCSDEmail = data.user.email.endsWith("@ucsd.edu");
                
                if (!isUCSDEmail) {
                    // Redirect to request access page if not UCSD email
                    window.location.href = "/auth/request-access";
                    return;
                }
                
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

// ==================== UTILITY FUNCTIONS ====================

/**
 * Show error message
 */
function showMessage(message) {
    alert("Error: " + message);
    // TODO: Replace with better UI notification
    console.log(message);
}