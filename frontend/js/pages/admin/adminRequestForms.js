/**
 * Admin Request Forms View
 * Handles pending course creation requests
 */

let allRequests = []; // Store all requests for filtering

export async function initRequestForms() {
  await loadRequests();
  initSearchBar();
}

/**
 * Load all pending requests from the server
 */
async function loadRequests() {
  const loadingMessage = document.getElementById("loadingMessage");
  const requestsContainer = document.getElementById("requestsContainer");
  const errorMessage = document.getElementById("errorMessage");

  try {
    const response = await fetch("/v1/api/admin/requests");
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to load requests");
    }

    // Store all requests for filtering
    allRequests = result.requests || [];

    // Hide loading, show requests container
    loadingMessage.style.display = "none";
    requestsContainer.style.display = "block";

    displayRequests(allRequests);
  } catch (error) {
    loadingMessage.style.display = "none";
    errorMessage.textContent = error.message;
    errorMessage.style.display = "block";
  }
}

/**
 * Display requests as collapsible cards
 * @param {Array} requests - Array of request objects
 */
function displayRequests(requests) {
  const noRequestsMessage = document.getElementById("noRequestsMessage");
  const requestsList = document.getElementById("requestsList");

  // Clear existing items first
  requestsList.innerHTML = "";

  if (!requests || requests.length === 0) {
    noRequestsMessage.style.display = "block";
    return;
  }

  noRequestsMessage.style.display = "none";

  // Populate list with request cards
  requests.forEach(request => {
    const item = createRequestCard(request);
    requestsList.appendChild(item);
  });
}

/**
 * Create a collapsible card for a request
 * @param {Object} request - Request object
 * @returns {HTMLDivElement} Request card element
 */
function createRequestCard(request) {
  const item = document.createElement("div");
  item.className = "request-item";
  item.dataset.requestId = request.requestUuid;

  const fullName = `${request.firstName} ${request.lastName}`;

  // Extract course info if available
  const courseCode = request.courseInfo?.courseCode || "Unknown";
  const season = request.courseInfo?.season || "Unknown";
  const year = request.courseInfo?.year || "Unknown";
  const role = request.courseInfo?.role || "Unknown";

  item.innerHTML = `
    <button class="request-header">
      <span class="request-name">${textToHtml(fullName)}</span>
      <span class="expand-icon">▼</span>
    </button>
    <section class="request-details">
      <section class="request-details-inner">
        <div class="request-info-grid">
          <div class="request-info-item">
            <span class="request-info-label">First Name</span>
            <span class="request-info-value">${textToHtml(request.firstName)}</span>
          </div>
          <div class="request-info-item">
            <span class="request-info-label">Last Name</span>
            <span class="request-info-value">${textToHtml(request.lastName)}</span>
          </div>
          <div class="request-info-item">
            <span class="request-info-label">Email</span>
            <span class="request-info-value">${textToHtml(request.email)}</span>
          </div>
          <div class="request-info-item">
            <span class="request-info-label">Institution</span>
            <span class="request-info-value">${textToHtml(request.relatedInstitution || "N/A")}</span>
          </div>
          <div class="request-info-item">
            <span class="request-info-label">Course</span>
            <span class="request-info-value">${textToHtml(courseCode)}</span>
          </div>
          <div class="request-info-item">
            <span class="request-info-label">Term</span>
            <span class="request-info-value">${textToHtml(season + "-" + year)}</span>
          </div>
          <div class="request-info-item">
            <span class="request-info-label">Role</span>
            <span class="request-info-value">${textToHtml(role)}</span>
          </div>
          <div class="request-info-item">
            <span class="request-info-label">Verification Code</span>
            <span class="request-info-value">${textToHtml(request.verificationCode)}</span>
          </div>
        </div>
        <footer class="request-actions">
          <button class="btn btn-secondary btn-sm deny-btn">Deny</button>
          <button class="btn btn-primary btn-sm approve-btn">Accept</button>
        </footer>
      </section>
    </section>
  `;

  // Add toggle functionality
  const header = item.querySelector(".request-header");
  header.addEventListener("click", () => {
    item.classList.toggle("expanded");
  });

  // Attach event listeners to buttons
  const approveBtn = item.querySelector(".approve-btn");
  const denyBtn = item.querySelector(".deny-btn");

  approveBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleApprove(request.requestUuid);
  });

  denyBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleDeny(request.requestUuid);
  });

  return item;
}

/**
 * Disable all action buttons for a specific request
 * @param {string} requestId - Request UUID
 * @returns {NodeList} The disabled buttons (so they can be re-enabled on error)
 */
function disableRequestButtons(requestId) {
  const item = document.querySelector(`.request-item[data-request-id="${requestId}"]`);
  if (!item) return null;

  const buttons = item.querySelectorAll("button");
  buttons.forEach(btn => btn.disabled = true);
  return buttons;
}

/**
 * Re-enable all action buttons for a specific request
 * @param {NodeList} buttons - The buttons to re-enable
 */
function enableRequestButtons(buttons) {
  if (!buttons) return;
  buttons.forEach(btn => btn.disabled = false);
}

/**
 * Handle approve button click
 * @param {string} requestId - Request UUID
 */
async function handleApprove(requestId) {
  // Disable all buttons to prevent double-clicking
  const buttons = disableRequestButtons(requestId);
  const item = document.querySelector(`.request-item[data-request-id="${requestId}"]`);

  if (!item) {
    showErrorMessage("Request not found");
    return;
  }

  try {
    const response = await fetch(`/v1/api/admin/requests/${requestId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Failed to approve request");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to approve request");
    }

    // Show success message
    showSuccessMessage("Request approved successfully!");

    // Remove from allRequests array and update display
    removeRequestFromList(requestId);
  } catch (error) {
    // Re-enable buttons on error
    enableRequestButtons(buttons);

    // Show error message
    showErrorMessage(error.message);
  }
}

/**
 * Handle deny button click
 * @param {string} requestId - Request UUID
 */
async function handleDeny(requestId) {
  // Confirm before denying
  if (!confirm("Are you sure you want to deny this request?")) {
    return;
  }

  // Disable all buttons to prevent double-clicking
  const buttons = disableRequestButtons(requestId);
  const item = document.querySelector(`.request-item[data-request-id="${requestId}"]`);

  if (!item) {
    showErrorMessage("Request not found");
    return;
  }

  try {
    const response = await fetch(`/v1/api/admin/requests/${requestId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Failed to deny request");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to deny request");
    }

    // Show success message
    showSuccessMessage("Request denied successfully!");

    // Remove from allRequests array and update display
    removeRequestFromList(requestId);
  } catch (error) {
    // Re-enable buttons on error
    enableRequestButtons(buttons);

    // Show error message
    showErrorMessage(error.message);
  }
}

/**
 * Remove a request from the list and update the UI
 * @param {string} requestId - Request UUID to remove
 */
function removeRequestFromList(requestId) {
  // Remove from allRequests array
  allRequests = allRequests.filter(req => req.requestUuid !== requestId);

  // Remove the item from the DOM
  const item = document.querySelector(`.request-item[data-request-id="${requestId}"]`);
  if (item) {
    item.remove();
  }

  // Check if list is empty now
  const remainingItems = document.querySelectorAll(".request-item");
  if (remainingItems.length === 0) {
    document.getElementById("noRequestsMessage").style.display = "block";
  }

  // If user is actively searching, update the filtered results
  const searchInput = document.getElementById("searchInput");
  if (searchInput && searchInput.value.trim()) {
    filterRequests(searchInput.value);
  }
}

/**
 * Convert plain text to safe HTML
 * @param {string} text - Text to convert
 * @returns {string} Safe HTML text
 */
function textToHtml(text) {
  if (text === null || text === undefined) {
    return "";
  }
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

/**
 * Show success message and auto-hide after 2 seconds
 * @param {string} message - Success message to display
 */
function showSuccessMessage(message) {
  const successMessage = document.getElementById("successMessage");
  const errorMessage = document.getElementById("errorMessage");

  // Hide error message if visible
  errorMessage.style.display = "none";

  // Show success message
  successMessage.textContent = message;
  successMessage.style.display = "block";

  // Scroll to top to show message
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Hide success message after 2 seconds
  setTimeout(() => {
    successMessage.style.display = "none";
  }, 2000);
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");

  // Hide success message if visible
  successMessage.style.display = "none";

  // Show error message
  errorMessage.textContent = message;
  errorMessage.style.display = "block";

  // Scroll to top to show message
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Initialize search bar functionality
 */
function initSearchBar() {
  const searchInput = document.getElementById("searchInput");

  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    filterRequests(e.target.value);
  });
}

/**
 * Filter requests based on search query
 * @param {string} query - Search query
 */
function filterRequests(query) {
  const trimmedQuery = query.trim().toLowerCase();

  if (!trimmedQuery) {
    // Show all requests if search is empty
    displayRequests(allRequests);
    return;
  }

  // Filter requests by first name or last name
  const filteredRequests = allRequests.filter(request => {
    const fullName = `${request.firstName} ${request.lastName}`.toLowerCase();
    const firstName = request.firstName.toLowerCase();
    const lastName = request.lastName.toLowerCase();

    return fullName.includes(trimmedQuery) ||
           firstName.includes(trimmedQuery) ||
           lastName.includes(trimmedQuery);
  });

  displayRequests(filteredRequests);
}
