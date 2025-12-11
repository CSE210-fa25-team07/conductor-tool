/**
 * Admin Add User View
 * Handles adding new users to the system
 * @module admin/addUser
 */
export async function initAddUser() {
  const isStudentRadio = document.getElementById("isStudent");
  const isProfRadio = document.getElementById("isProf");
  const isSystemAdminCheckbox = document.getElementById("isSystemAdmin");
  const cancelBtn = document.getElementById("cancelBtn");
  const addUserForm = document.getElementById("addUserForm");

  // Setup event listeners
  isSystemAdminCheckbox.addEventListener("change", (e) => handleSystemAdminChange(e, isProfRadio));
  isStudentRadio.addEventListener("change", (e) => handleStudentChange(e, isSystemAdminCheckbox));
  cancelBtn.addEventListener("click", handleCancel);
  addUserForm.addEventListener("submit", (e) => handleFormSubmit(e, isStudentRadio, isProfRadio, isSystemAdminCheckbox));
}

/**
 * Handle System Admin checkbox change
 * Automatically selects Professor when System Admin is checked
 */
function handleSystemAdminChange(event, isProfRadio) {
  if (event.target.checked) {
    isProfRadio.checked = true;
  }
}

/**
 * Handle Student radio button change
 * Unchecks System Admin when Student is selected
 */
function handleStudentChange(event, isSystemAdminCheckbox) {
  if (event.target.checked && isSystemAdminCheckbox.checked) {
    isSystemAdminCheckbox.checked = false;
  }
}

/**
 * Handle cancel button click
 */
function handleCancel() {
  window.location.reload();
}

/**
 * Validate that a user type is selected
 */
function validateUserType(isStudentRadio, isProfRadio) {
  if (!isStudentRadio.checked && !isProfRadio.checked) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.textContent = "Please select a user type (Student or Professor).";
    errorMessage.style.display = "block";
    return false;
  }
  return true;
}

/**
 * Collect form data
 */
function getFormData(isStudentRadio, isProfRadio, isSystemAdminCheckbox) {
  return {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    email: document.getElementById("email").value,
    isStudent: isStudentRadio.checked,
    isProf: isProfRadio.checked,
    isSystemAdmin: isSystemAdminCheckbox.checked
  };
}

/**
 * Disable form inputs and buttons
 */
function disableForm() {
  const form = document.getElementById("addUserForm");
  const inputs = form.querySelectorAll("input, button");
  inputs.forEach(input => input.disabled = true);
}

/**
 * Enable form inputs and buttons
 */
function enableForm() {
  const form = document.getElementById("addUserForm");
  const inputs = form.querySelectorAll("input, button");
  inputs.forEach(input => input.disabled = false);
}

/**
 * Submit user data to backend API
 */
async function submitUserData(formData) {
  // Disable form during submission
  disableForm();

  try {
    const response = await fetch("/v1/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to add user");
    }

    // Show success message
    const successMessage = document.getElementById("successMessage");
    successMessage.textContent = "User successfully added!";
    successMessage.style.display = "block";

    // Reload page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error) {
    // Re-enable form if there's an error
    enableForm();
    throw error;
  }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event, isStudentRadio, isProfRadio, isSystemAdminCheckbox) {
  event.preventDefault();

  // Hide previous error messages and reset color
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.style.display = "none";

  // Validate user type selection
  if (!validateUserType(isStudentRadio, isProfRadio)) {
    return;
  }

  // Collect form data
  const formData = getFormData(isStudentRadio, isProfRadio, isSystemAdminCheckbox);

  // Submit form data to backend
  try {
    await submitUserData(formData);
  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.style.display = "block";
  }
}

