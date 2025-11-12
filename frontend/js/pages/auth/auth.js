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

    // TODO: Retrieve user email from Google OAuth response
    
    if (verificationForm) {
        verificationForm.addEventListener("submit", (e) => {
            e.preventDefault();
            handleVerification();
        });
    }
});

// ==================== LOGIN FUNCTIONS ====================

/**
 * Handle Google OAuth login
 */
function handleGoogleLogin() {
    console.log("Google login button clicked");
    
    // TODO: Replace with actual OAuth endpoint
    window.location.href = "/auth/google";
    
    // TODO: Bring in Backend functionality

}

// ==================== VERIFICATION FUNCTIONS ====================

/**
 * Handle verification code submission
 */
function handleVerification() {
    const codeInput = document.getElementById("verification-code");
    const code = codeInput.value.trim();
    
    // Validate input
    if (!code) {
        showMessage("Please enter a verification code");
        return;
    }
    
    console.log("Verifying code:", code);
    
    // TODO: Check verification code with database
    
    // Redirect to Class Directory on success
    // window.location.href = "/";

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