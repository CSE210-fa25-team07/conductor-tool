/** @module authentication/frontend */
import { handleVerification } from "../../utils/authVerify.js";
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
  window.location.href = "/logout";
}

// ==================== ACCESS REQUEST FORM FUNCTIONS ====================

/**
 * Handle access request form submission
 */
async function handleAccessRequest() {
  const codeInput = document.getElementById("verification-code");
  codeInput.addEventListener("input", () => {
    codeInput.setCustomValidity("");
  });

  // Get form data
  const formData = {
    firstName: document.getElementById("first-name").value.trim(),
    lastName: document.getElementById("last-name").value.trim(),
    email: document.getElementById("email").value.trim(),
    institution: document.getElementById("institution").value.trim(),
    verificationCode: codeInput.value.trim()
  };

  const response = await fetch("/v1/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code: formData.verificationCode })
  });
  const data = await response.json();

  if (response.ok && data.success) {
    // POST data to backend
    const requestResponse = await fetch("/v1/api/auth/request-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData)
    });

    const requestData = await requestResponse.json();
    if (requestData.success) {
      showSuccessMessage();
    } else {
      alert("Error submitting access request: " + requestData.error);
    }
  } else {
    // Verification failed
    codeInput.setCustomValidity(data.error);
    return;
  }
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
      <button onclick="window.location.href = '/logout'" class="btn btn-primary">Return to Login</button>
    </nav>
  `;
}
