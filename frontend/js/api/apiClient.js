/**
 * API Client
 * Handles HTTP requests to the backend API with authentication
 * @module apiClient
 */

/**
 * Base API URL - defaults to localhost:8081 (backend server)
 * In production, this should be set via environment variable
 */
const API_BASE_URL = "http://localhost:8081";

/**
 * API Client class for making HTTP requests
 */
class ApiClient {
  /**
   * Make a GET request to the API
   * @param {string} endpoint - API endpoint path (e.g., "/api/courses/123")
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} Response data
   * @throws {Error} If request fails
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: "GET",
      ...options
    });
  }

  /**
   * Make a POST request to the API
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} Response data
   * @throws {Error} If request fails
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Make a PUT request to the API
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} Response data
   * @throws {Error} If request fails
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Make a DELETE request to the API
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} Response data
   * @throws {Error} If request fails
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: "DELETE",
      ...options
    });
  }

  /**
   * Generic request method
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   * @throws {Error} If request fails
   * @private
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      // Get auth token from session/localStorage if available
      // TODO: Integrate with Auth team's authentication module
      const token = this.getAuthToken();

      const headers = {
        ...options.headers
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include" // Include cookies for session management
      });

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Parse and return JSON response
      const data = await response.json();
      return data;

    } catch (error) {
      // Re-throw with additional context
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  /**
   * Get authentication token from storage
   * @returns {string|null} Auth token or null if not found
   * @private
   */
  getAuthToken() {
    // TODO: Coordinate with Auth team on token storage strategy
    // For now, check both sessionStorage and localStorage
    return sessionStorage.getItem("authToken") ||
           localStorage.getItem("authToken") ||
           null;
  }

  /**
   * Set authentication token in storage
   * @param {string} token - Auth token to store
   */
  setAuthToken(token) {
    sessionStorage.setItem("authToken", token);
  }

  /**
   * Clear authentication token from storage
   */
  clearAuthToken() {
    sessionStorage.removeItem("authToken");
    localStorage.removeItem("authToken");
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
