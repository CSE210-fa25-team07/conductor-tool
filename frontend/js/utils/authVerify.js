/**
 * Utility functions for course verification
 * @module utils/authVerify
 */

/**
 * Handles verification form submission by validating the user's code
 *
 * Sends the entered verification code to `v1/api/auth/verify`. Redirects to the
 * dashboard upon success or shows an alert on failure. Invalid input is handled through
 * validation messages on the input field.
 */
export async function handleVerification() {
  const codeInput = document.getElementById("verification-code");
  const code = codeInput.value.trim();

  codeInput.addEventListener("input", () => {
    codeInput.setCustomValidity("");
  });

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
      codeInput.setCustomValidity(data.error);
      return;
    }

  } catch {
    alert("An error occurred during verification. Please try again.");
  }
}
