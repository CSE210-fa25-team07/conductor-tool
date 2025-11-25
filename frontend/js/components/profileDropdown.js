/**
 * @fileoverview Profile Dropdown Component
 * Shared component for user profile avatar and dropdown menu
 * Used in dashboard, class features, and other pages
 */

/**
 * Initialize the profile dropdown component
 * Fetches user data from API and sets up dropdown behavior
 */
export async function initProfileDropdown() {
  await updateProfileFromAPI();
  setupDropdownBehavior();
}

/**
 * Fetch user data from API and update avatar/name
 */
export async function updateProfileFromAPI() {
  try {
    const response = await fetch("/v1/api/auth/session", {
      credentials: "include"
    });

    if (response.ok) {
      const data = await response.json();
      if (data.user && data.user.name && data.user.id) {
        updateProfileDisplay(data.user.name);

        // Fetch user status and initialize dropdown menu
        const statusResponse = await fetch("/v1/api/user-context/status", {
          credentials: "include"
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.success && statusData.data) {
            const userType = determineUserType(statusData.data);
            createUserDropdown(userType);
          }
        } else {
          // Default to student if status fetch fails
          createUserDropdown("student");
        }
      }
    }
  } catch (error) {
    // Silently fail - profile will show default state
  }
}

/**
 * Determine user type based on staff status
 * @param {Object} status - User status object with isProf, isSystemAdmin, isLeadAdmin
 * @returns {string} User type: "admin" or "professor" or "student"
 */
function determineUserType(status) {
  if (status.isSystemAdmin || status.isLeadAdmin) {
    return "admin";
  } else if (status.isProf) {
    return "professor";
  } else {
    return "student";
  }
}

/**
 * Update the profile display with user name
 * @param {string} name - User's full name
 */
export function updateProfileDisplay(name) {
  const userAvatar = document.querySelector(".user-avatar");
  const userName = document.querySelector(".user-name");

  if (userAvatar) {
    // Fetch and display photo URL
    fetchUserPhoto(userAvatar, name);
  }

  if (userName) {
    userName.textContent = name;
  }
}

/**
 * Fetch user photo URL and update avatar display
 * @param {HTMLElement} userAvatar - Avatar element
 * @param {string} name - User's full name for fallback initials
 */
async function fetchUserPhoto(userAvatar, name) {
  try {
    const response = await fetch("/v1/api/user-context/photo", {
      credentials: "include"
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data.photoUrl) {
        // Clear text content and add image
        userAvatar.textContent = "";
        const img = document.createElement("img");
        img.src = data.data.photoUrl;
        img.alt = name;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.borderRadius = "50%";
        userAvatar.appendChild(img);
      } else {
        // Fallback to initials
        displayInitials(userAvatar, name);
      }
    } else {
      // Fallback to initials
      displayInitials(userAvatar, name);
    }
  } catch (error) {
    // Fallback to initials on error
    displayInitials(userAvatar, name);
  }
}

/**
 * Display user initials in avatar
 * @param {HTMLElement} userAvatar - Avatar element
 * @param {string} name - User's full name
 */
function displayInitials(userAvatar, name) {
  const initials = name.split(" ").map(word => word[0]).join("").toUpperCase();
  userAvatar.textContent = initials;
}

/**
 * Set up dropdown toggle and close behavior
 */
export function setupDropdownBehavior() {
  const userProfileTrigger = document.getElementById("user-profile-trigger");
  const userDropdown = document.getElementById("user-dropdown");

  if (userProfileTrigger && userDropdown) {
    userProfileTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      userDropdown.classList.remove("show");
    });
  }
}

/**
 * Create and populate the user dropdown menu
 * @param {string} userType - Either "professor", "admin", or "student"
 */
export function createUserDropdown(userType = "student") {
  const dropdown = document.getElementById("user-dropdown");

  if (!dropdown) return;

  // Clear existing content
  dropdown.innerHTML = "";

  // Define menu items based on user type
  // Add Profie for all user types
  const menuItems = [
      { text: "Profile", href: "/profile" }
  ];

  // Add Requests option for admin users
  if (userType === "admin") {
    menuItems.push({ text: "Requests", href: "/requests" });
  }

  // Add Log Out for all users
  menuItems.push({ text: "Log Out", href: "/logout" });

  // Create and append each menu item
  menuItems.forEach(item => {
    const link = document.createElement("a");
    link.href = item.href;
    link.className = "dropdown-item";
    link.textContent = item.text;
    dropdown.appendChild(link);
  });
}