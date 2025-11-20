/** @module authentication/frontend */
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
  // Redirect to Google OAuth - backend handles user creation/login
  window.location.href = "/google/auth";

  // TODO: Bring in Backend functionality
}

// ==================== VERIFICATION FUNCTIONS ====================

/**
 * Handles verification form submission by validating the user's code
 * and checking if the authenticated email belongs to UCSD.
 *
 * Retrieves the user session from `v1/api/auth/session`, confirms the email domain,
 * and sends the entered verification code to `v1/api/auth/verify`. Redirects to the
 * dashboard upon success or shows an alert on failure.
 */
async function handleVerification() {
  const codeInput = document.getElementById("verification-code");
  const code = codeInput.value.trim();

  // Validate input
  if (!code) {
    alert("Please enter a verification code");
    return;
  }

  try {
    // Call backend to verify code and create user
    const response = await fetch("/v1/api/auth/verify", {
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
      alert(data.error || "Invalid verification code");
    }

  } catch {
    alert("An error occurred during verification. Please try again.");
  }
}

// ==================== REQUEST ACCESS FUNCTIONS ====================

/**
 * Loads and displays the user's email address from the current session.
 */
async function loadUserEmail() {
  try {
    const response = await fetch("/v1/api/auth/session", {
      credentials: "include"
    });

    if (response.ok) {
      const data = await response.json();
      if (data.user && data.user.email) {
        const emailDisplay = document.getElementById("user-email-display");
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
    alert("Error fetching user session:", error);
  }
}

/**
 * Logs the user out by invalidating their session and redirecting to login.
 */
function logout() {
  fetch("/logout", {
    method: "GET",
    credentials: "include"
  }).then(() => {
    window.location.href = "/";
  }).catch((error) => {
    alert("Error during logout:", error);
  });
}

// ==================== ACCESS REQUEST FORM FUNCTIONS ====================

/**
 * Handle access request form submission
 */
async function handleAccessRequest() {
  // Get form data
  const formData = {
    firstName: document.getElementById("first-name").value,
    lastName: document.getElementById("last-name").value,
    email: document.getElementById("email").value,
    institution: document.getElementById("institution").value,
    verificationCode: document.getElementById("verification-code").value
  };

  // TODO: POST to backend

  // For now, just show success message
  showSuccessMessage();
}

/**
 * Show success message after form submission
 */
function showSuccessMessage() {
  const form = document.querySelector(".form");

  form.innerHTML = `
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
