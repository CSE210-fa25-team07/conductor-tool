/**
 * @fileoverview Generic Template Loader
 * Loads and caches HTML templates for any feature
 */

const templateCache = new Map();

/**
 * Load an HTML template from a file
 * @param {string} feature - Feature name (directory, attendance, standup, etc.)
 * @param {string} templateName - Name of the template file (without .html extension)
 * @returns {Promise<string>} The template HTML content
 */
export async function loadTemplate(feature, templateName) {
  const cacheKey = `${feature}/${templateName}`;

  // Check cache first
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey);
  }

  try {
    const response = await fetch(`/html/${feature}/${templateName}.html`);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${cacheKey}`);
    }

    const html = await response.text();

    // Parse the template element
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const template = doc.querySelector("template");

    if (!template) {
      throw new Error(`No <template> found in ${cacheKey}.html`);
    }

    const templateHTML = template.innerHTML;

    // Cache the template
    templateCache.set(cacheKey, templateHTML);
    return templateHTML;

  } catch (error) {
    throw error;
  }
}

/**
 * Clear the template cache
 * @param {string} feature - Optional feature name to clear only that feature's cache
 */
export function clearTemplateCache(feature = null) {
  if (feature) {
    // Clear only templates for a specific feature
    const keysToDelete = [];
    for (const key of templateCache.keys()) {
      if (key.startsWith(`${feature}/`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => templateCache.delete(key));
  } else {
    // Clear entire cache
    templateCache.clear();
  }
}
