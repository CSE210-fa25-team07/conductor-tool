/**
 * Admin Manage Users View
 *
 * Manages user accounts and permissions in the system.
 * Features:
 * - View all users organized by role (Lead Admin, Admins, Professors, Students)
 * - Search/filter users by name or email
 * - Promote professors to admin status
 * - Demote admins to professor status (lead admin only)
 * - Remove students and professors from the system
 * - Transfer lead admin status to another admin
 *
 * Permission Rules:
 * - Any admin can promote professors to admin
 * - Only lead admin can demote admins to professors
 * - Only lead admin can transfer lead admin status
 * - Admins cannot be removed (must be demoted first)
 * - Lead admin cannot be demoted (must transfer status first)
 * @module admin/manageUsers
 */

import { loadUserContext, getCurrentUser } from "../../utils/userContext.js";

let allUsers = []; // Store all users for filtering
let currentUser = null; // Store current logged-in user info

export async function initManageUsers() {
  await loadCurrentUserInfo();
  await loadUsers();
  initSearchBar();
}

/**
 * Load current user information from user context
 */
async function loadCurrentUserInfo() {
  try {
    await loadUserContext();
    const user = getCurrentUser();
    if (user) {
      currentUser = {
        userUuid: user.userUuid,
        email: user.email,
        isSystemAdmin: user.isSystemAdmin || false,
        isLeadAdmin: user.isLeadAdmin || false
      };
    } else {
      // No user found - should not happen on admin page
      window.location.href = "/login";
    }
  } catch {
    // Redirect to login instead of defaulting to admin permissions
    window.location.href = "/login";
  }
}

/**
 * Load all users from the server
 */
async function loadUsers() {
  const loadingMessage = document.getElementById("loadingMessage");
  const usersContainer = document.getElementById("usersContainer");
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");

  // Clear any existing messages when reloading
  errorMessage.style.display = "none";
  successMessage.style.display = "none";

  try {
    const response = await fetch("/v1/api/admin/users");
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to load users");
    }

    // Store all users for filtering
    allUsers = result.users || [];

    // Hide loading, show users container
    loadingMessage.style.display = "none";
    usersContainer.style.display = "block";

    displayUsers(allUsers);
  } catch (error) {
    loadingMessage.style.display = "none";
    showErrorMessage(error.message);
  }
}

/**
 * Display users in their respective sections
 * @param {Array} users - Array of user objects
 */
function displayUsers(users) {
  // Categorize users
  const leadAdmin = users.find(u => u.isLeadAdmin);
  const admins = users.filter(u => u.isSystemAdmin && !u.isLeadAdmin);
  const professors = users.filter(u => u.isProf && !u.isSystemAdmin);
  const students = users.filter(u => !u.isProf && !u.isSystemAdmin);

  // Display each category
  displayLeadAdmin(leadAdmin);
  displayAdmins(admins);
  displayProfessors(professors);
  displayStudents(students);
}

/**
 * Update section header with user count
 * @param {string} sectionName - Name of the section
 * @param {number} count - Number of users
 */
function updateSectionCount(sectionName, count) {
  // Find the section header by text content
  const headers = document.querySelectorAll(".user-section-title");
  headers.forEach(header => {
    if (header.textContent.includes(sectionName)) {
      // Remove existing count if present
      const baseText = header.textContent.replace(/\s*\(\d+\)$/, "");
      header.textContent = `${baseText} (${count})`;
    }
  });
}

/**
 * Display the lead admin
 * @param {Object} leadAdmin - Lead admin user object
 */
function displayLeadAdmin(leadAdmin) {
  const leadAdminList = document.getElementById("leadAdminList");
  leadAdminList.innerHTML = "";

  if (!leadAdmin) {
    leadAdminList.innerHTML = "<p class=\"no-users-message\">No lead admin found.</p>";
    return;
  }

  const userCard = createUserCard(leadAdmin, "leadAdmin");
  leadAdminList.appendChild(userCard);
}

/**
 * Display admins
 * @param {Array} admins - Array of admin user objects
 */
function displayAdmins(admins) {
  const adminsList = document.getElementById("adminsList");
  const noAdminsMessage = document.getElementById("noAdminsMessage");

  adminsList.innerHTML = "";

  if (!admins || admins.length === 0) {
    noAdminsMessage.style.display = "block";
    updateSectionCount("Admins", 0);
    return;
  }

  noAdminsMessage.style.display = "none";

  admins.forEach(admin => {
    const userCard = createUserCard(admin, "admin");
    adminsList.appendChild(userCard);
  });

  // Update section header with count
  updateSectionCount("Admins", admins.length);
}

/**
 * Display professors
 * @param {Array} professors - Array of professor user objects
 */
function displayProfessors(professors) {
  const professorsList = document.getElementById("professorsList");
  const noProfessorsMessage = document.getElementById("noProfessorsMessage");

  professorsList.innerHTML = "";

  if (!professors || professors.length === 0) {
    noProfessorsMessage.style.display = "block";
    updateSectionCount("Professors", 0);
    return;
  }

  noProfessorsMessage.style.display = "none";

  professors.forEach(professor => {
    const userCard = createUserCard(professor, "professor");
    professorsList.appendChild(userCard);
  });

  // Update section header with count
  updateSectionCount("Professors", professors.length);
}

/**
 * Display students
 * @param {Array} students - Array of student user objects
 */
function displayStudents(students) {
  const studentsList = document.getElementById("studentsList");
  const noStudentsMessage = document.getElementById("noStudentsMessage");

  studentsList.innerHTML = "";

  if (!students || students.length === 0) {
    noStudentsMessage.style.display = "block";
    updateSectionCount("Students", 0);
    return;
  }

  noStudentsMessage.style.display = "none";

  students.forEach(student => {
    const userCard = createUserCard(student, "student");
    studentsList.appendChild(userCard);
  });

  // Update section header with count
  updateSectionCount("Students", students.length);
}

/**
 * Create a collapsible card for a user
 * @param {Object} user - User object
 * @param {string} userType - Type of user (leadAdmin, admin, professor, student)
 * @returns {HTMLDivElement} User card element
 */
function createUserCard(user, userType) {
  const item = document.createElement("div");
  item.className = "request-item";
  item.dataset.userId = user.userUuid;
  item.dataset.userType = userType;

  const fullName = `${user.firstName} ${user.lastName}`;

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
            <span class="request-info-value">${textToHtml(user.firstName)}</span>
          </div>
          <div class="request-info-item">
            <span class="request-info-label">Last Name</span>
            <span class="request-info-value">${textToHtml(user.lastName)}</span>
          </div>
          <div class="request-info-item">
            <span class="request-info-label">Email</span>
            <span class="request-info-value">${textToHtml(user.email)}</span>
          </div>
        </div>
        <footer class="request-actions">
          ${createActionButtons(user, userType)}
        </footer>
      </section>
    </section>
  `;

  // Add toggle functionality
  const header = item.querySelector(".request-header");
  header.addEventListener("click", () => {
    item.classList.toggle("expanded");
  });

  // Attach event listeners to action buttons
  attachButtonListeners(item, user);

  return item;
}

/**
 * Create action buttons based on user type and permissions
 * @param {Object} user - User object
 * @param {string} userType - User type
 * @returns {string} HTML for action buttons
 */
function createActionButtons(user, userType) {
  const isCurrentUser = currentUser && currentUser.userUuid === user.userUuid;
  const isLeadAdmin = currentUser && currentUser.isLeadAdmin;

  let buttons = "";

  // Lead Admin actions
  if (userType === "leadAdmin") {
    // Lead admin has no actions on their own card
  }
  // Admin actions
  else if (userType === "admin") {
    // Only lead admin can perform actions on admins
    if (isLeadAdmin) {
      buttons += "<button class=\"btn btn-primary btn-sm promote-to-lead-btn\">Promote to Lead Admin</button>";
      if (!isCurrentUser) {
        buttons += "<button class=\"btn btn-secondary btn-sm demote-btn\">Demote to Professor</button>";
      }
    }
  }
  // Professor actions
  else if (userType === "professor") {
    buttons += "<button class=\"btn btn-primary btn-sm promote-btn\">Promote to Admin</button>";
    buttons += "<button class=\"btn btn-secondary btn-sm remove-btn\">Remove User</button>";
  }
  // Student actions
  else if (userType === "student") {
    buttons += "<button class=\"btn btn-secondary btn-sm remove-btn\">Remove User</button>";
  }

  return buttons || "<span style=\"color: var(--color-forest-green-medium); font-size: var(--text-sm);\">No actions available</span>";
}

/**
 * Attach event listeners to action buttons
 * @param {HTMLElement} item - User card element
 * @param {Object} user - User object
 */
function attachButtonListeners(item, user) {
  const promoteBtn = item.querySelector(".promote-btn");
  const demoteBtn = item.querySelector(".demote-btn");
  const removeBtn = item.querySelector(".remove-btn");
  const promoteToLeadBtn = item.querySelector(".promote-to-lead-btn");

  if (promoteBtn) {
    promoteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handlePromote(user.userUuid);
    });
  }

  if (demoteBtn) {
    demoteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleDemote(user.userUuid);
    });
  }

  if (promoteToLeadBtn) {
    promoteToLeadBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handlePromoteToLead(user);
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleRemove(user.userUuid, user.firstName, user.lastName);
    });
  }
}

/**
 * Disable all action buttons for a specific user and show loading state
 * @param {string} userId - User UUID
 * @param {string} buttonClass - Class of the button being clicked
 * @returns {Object} Object containing buttons and original button text
 */
function disableUserButtons(userId, buttonClass) {
  const item = document.querySelector(`.request-item[data-user-id="${userId}"]`);
  if (!item) return null;

  const buttons = item.querySelectorAll("button");
  const clickedButton = item.querySelector(`.${buttonClass}`);
  const originalText = clickedButton ? clickedButton.textContent : "";

  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn === clickedButton) {
      btn.textContent = "Processing...";
    }
  });

  return { buttons, clickedButton, originalText };
}

/**
 * Re-enable all action buttons and restore original text
 * @param {Object} buttonState - Object containing buttons and original text
 */
function enableUserButtons(buttonState) {
  if (!buttonState) return;
  const { buttons, clickedButton, originalText } = buttonState;

  buttons.forEach(btn => btn.disabled = false);
  if (clickedButton && originalText) {
    clickedButton.textContent = originalText;
  }
}

/**
 * Handle promote professor to admin
 * @param {string} userUuid - User UUID
 */
async function handlePromote(userUuid) {
  if (!confirm("Are you sure you want to promote this professor to admin?")) {
    return;
  }

  const buttonState = disableUserButtons(userUuid, "promote-btn");

  try {
    const response = await fetch(`/v1/api/admin/users/${userUuid}/promote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to promote user");
    }

    showSuccessMessage("Professor promoted to admin successfully!");

    // Reload users after a short delay
    setTimeout(() => {
      loadUsers();
    }, 1500);
  } catch (error) {
    enableUserButtons(buttonState);
    showErrorMessage(error.message);
  }
}

/**
 * Handle demote admin to professor
 * @param {string} userUuid - User UUID
 */
async function handleDemote(userUuid) {
  if (!confirm("Are you sure you want to demote this admin to professor?")) {
    return;
  }

  const buttonState = disableUserButtons(userUuid, "demote-btn");

  try {
    const response = await fetch(`/v1/api/admin/users/${userUuid}/demote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to demote user");
    }

    showSuccessMessage("Admin demoted to professor successfully!");

    // Reload users after a short delay
    setTimeout(() => {
      loadUsers();
    }, 1500);
  } catch (error) {
    enableUserButtons(buttonState);
    showErrorMessage(error.message);
  }
}

/**
 * Handle remove user
 * @param {string} userUuid - User UUID
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 */
async function handleRemove(userUuid, firstName, lastName) {
  if (!confirm(`Are you sure you want to remove ${firstName} ${lastName} from the system? This action cannot be undone.`)) {
    return;
  }

  const buttonState = disableUserButtons(userUuid, "remove-btn");

  try {
    const response = await fetch(`/v1/api/admin/users/${userUuid}`, {
      method: "DELETE"
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to remove user");
    }

    showSuccessMessage("User removed successfully!");

    // Reload users from server to ensure consistency
    setTimeout(() => {
      loadUsers();
    }, 1500);
  } catch (error) {
    enableUserButtons(buttonState);
    showErrorMessage(error.message);
  }
}

/**
 * Handle promote admin to lead admin
 * @param {Object} user - User object to promote to lead admin
 */
async function handlePromoteToLead(user) {
  // Confirm promotion
  const confirmMessage = `Are you sure you want to promote ${user.firstName} ${user.lastName} to Lead Admin?\n\nYou will be demoted to a regular admin and will no longer be able to:\n- Promote admins to lead admin\n- Demote admins to professors\n\nThis action is irreversible without another lead admin transferring back.`;

  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    const response = await fetch("/v1/api/admin/transfer-lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        newLeadAdminUuid: user.userUuid
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to promote to lead admin");
    }

    showSuccessMessage("Admin promoted to lead admin successfully! Reloading page...");

    // Reload page after transfer since current user's permissions changed
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error) {
    showErrorMessage(error.message);
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
 * Show success message (will be cleared when loadUsers() is called)
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
    filterUsers(e.target.value);
  });
}

/**
 * Filter users based on search query
 * @param {string} query - Search query
 */
function filterUsers(query) {
  const trimmedQuery = query.trim().toLowerCase();

  if (!trimmedQuery) {
    // Show all users if search is empty
    displayUsers(allUsers);
    return;
  }

  // Filter users by name or email
  const filteredUsers = allUsers.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const firstName = user.firstName.toLowerCase();
    const lastName = user.lastName.toLowerCase();
    const email = user.email.toLowerCase();

    return fullName.includes(trimmedQuery) ||
           firstName.includes(trimmedQuery) ||
           lastName.includes(trimmedQuery) ||
           email.includes(trimmedQuery);
  });

  displayUsers(filteredUsers);
}
