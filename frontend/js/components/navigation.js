/**
 * @fileoverview Navigation Component
 * Handles top navigation and secondary sidebar navigation
 * @module components/navigation
 */

/**
 * Creates the top navigation bar
 * @param {Object} options - Configuration options
 * @param {string} options.activeFeature - Currently active feature (class, calendar, journal)
 * @param {string} options.courseId - Current course ID
 * @param {Object} options.user - User object with name and avatar info
 * @returns {HTMLElement} Top navigation element
 */
export function createTopNav({ activeFeature = "", courseId = null, user = null } = {}) {
  const nav = document.createElement("nav");
  nav.className = "top-nav";

  const container = document.createElement("div");
  container.className = "top-nav-container";

  // Logo
  const logo = document.createElement("div");
  logo.className = "top-nav-logo";
  logo.textContent = "Conductor";
  logo.onclick = () => window.location.href = "/dashboard";

  // Navigation Links (only show if we have a courseId)
  const links = document.createElement("div");
  links.className = "top-nav-links";

  if (courseId) {
    const features = [
      { id: "class", label: "Class" },
      { id: "calendar", label: "Calendar" },
      { id: "journal", label: "Journal" }
    ];

    features.forEach(feature => {
      const link = document.createElement("div");
      link.className = "top-nav-link";
      if (activeFeature === feature.id) {
        link.classList.add("active");
      }
      link.textContent = feature.label;
      link.onclick = () => window.location.href = `/course/${courseId}/${feature.id}`;
      links.appendChild(link);
    });
  }

  // User Profile
  const userProfile = createUserProfile(user);

  container.appendChild(logo);
  container.appendChild(links);
  container.appendChild(userProfile);
  nav.appendChild(container);

  return nav;
}

/**
 * Creates the user profile section with dropdown
 * @param {Object} user - User object
 * @param {string} user.name - User's name
 * @param {string} user.avatar - User's avatar URL or initials
 * @returns {HTMLElement} User profile element with dropdown
 */
function createUserProfile(user = null) {
  // Create dropdown container
  const dropdownContainer = document.createElement("div");
  dropdownContainer.className = "user-profile-dropdown";

  // Create profile trigger
  const profile = document.createElement("div");
  profile.className = "user-profile";
  profile.id = "user-profile-trigger";

  const avatar = document.createElement("div");
  avatar.className = "user-avatar";

  if (user) {
    avatar.textContent = user.avatar || getInitials(user.name);
  } else {
    avatar.textContent = "U";
  }

  const name = document.createElement("div");
  name.className = "user-name";
  name.textContent = user ? user.name : "User";

  profile.appendChild(avatar);
  profile.appendChild(name);

  // Create dropdown menu
  const dropdownMenu = document.createElement("div");
  dropdownMenu.className = "dropdown-menu";
  dropdownMenu.id = "user-dropdown";

  const profileLink = document.createElement("a");
  profileLink.href = "/profile";
  profileLink.className = "dropdown-item";
  profileLink.textContent = "Profile";

  const logoutLink = document.createElement("a");
  logoutLink.href = "/logout";
  logoutLink.className = "dropdown-item";
  logoutLink.textContent = "Log Out";

  dropdownMenu.appendChild(profileLink);
  dropdownMenu.appendChild(logoutLink);

  dropdownContainer.appendChild(profile);
  dropdownContainer.appendChild(dropdownMenu);

  return dropdownContainer;
}

/**
 * Gets initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
function getInitials(name) {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Creates the secondary sidebar navigation
 * @param {Object} options - Configuration options
 * @param {string} options.feature - Current feature (class, calendar, journal)
 * @param {string} options.courseId - Current course ID
 * @param {string} options.activePage - Currently active page in the feature
 * @returns {HTMLElement} Secondary navigation element
 */
export function createSecondaryNav({ feature, courseId, activePage = "" } = {}) {
  const nav = document.createElement("nav");
  nav.className = "secondary-nav";

  const linksContainer = document.createElement("div");
  linksContainer.className = "secondary-nav-links";

  const navigationMap = {
    class: [
      { id: "dashboard", label: "Dashboard" },
      { id: "people", label: "People" },
      { id: "group", label: "Group" },
      { id: "my", label: "My" }
    ],
    calendar: [
      { id: "calendar", label: "Calendar" },
      { id: "analysis", label: "Analysis" }
    ],
    journal: [
      { id: "dashboard", label: "Dashboard" },
      { id: "team", label: "Team" }
    ]
  };

  const pages = navigationMap[feature] || [];

  pages.forEach(page => {
    const link = document.createElement("div");
    link.className = "secondary-nav-link";
    if (activePage === page.id) {
      link.classList.add("active");
    }
    link.textContent = page.label;
    // Use hash-based navigation within the same page
    link.onclick = () => {
      window.location.hash = page.id;
      // Dispatch event for page switching
      const event = new CustomEvent("navigate", {
        detail: { path: `${feature}/${page.id}` }
      });
      window.dispatchEvent(event);
    };
    linksContainer.appendChild(link);
  });

  nav.appendChild(linksContainer);

  return nav;
}

/**
 * Gets course ID from URL
 * @returns {string|null} Course ID or null
 */
export function getCourseIdFromUrl() {
  const pathParts = window.location.pathname.split("/");
  const courseIndex = pathParts.indexOf("course");
  if (courseIndex !== -1 && pathParts[courseIndex + 1]) {
    return pathParts[courseIndex + 1];
  }
  return null;
}

/**
 * Gets feature from URL
 * @returns {string|null} Feature name or null
 */
export function getFeatureFromUrl() {
  const pathParts = window.location.pathname.split("/");
  const lastPart = pathParts[pathParts.length - 1];
  if (["class", "calendar", "journal"].includes(lastPart)) {
    return lastPart;
  }
  return null;
}

/**
 * Sets up navigation event listeners
 * @param {Function} onNavigate - Callback function for navigation events
 */
export function setupNavigation(onNavigate) {
  window.addEventListener("navigate", (event) => {
    if (onNavigate && typeof onNavigate === "function") {
      onNavigate(event.detail.path);
    }
  });
}
