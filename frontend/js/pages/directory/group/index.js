import { getTeamProfile } from "../../../api/directory/directoryApiMock.js";

/**
 * Get a URL search param value.
 * @param {string} name - Param key to retrieve.
 * @returns {string|null} The parameter value or null if absent.
 */
function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Coalesce nullish/empty values to a fallback string.
 * @param {unknown} value - The value to coalesce.
 * @param {string} [fallback="—"] - Fallback string.
 * @returns {string} A non-empty string.
 */
function byDefined(value, fallback = "—") {
  return (value === null || value === undefined || value === "") ? fallback : value;
}

/**
 * Format an ISO date string into a human-readable short date.
 * @param {string|null|undefined} iso - ISO date string or null/undefined.
 * @returns {string} Localized date or original string if invalid.
 */
function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

/**
 * Toggle [hidden] attribute.
 * @param {HTMLElement} el - Element to hide/show.
 * @param {boolean} hidden - Whether to hide.
 */
function setHidden(el, hidden) {
  if (!el) return;
  if (hidden) el.setAttribute("hidden", "");
  else el.removeAttribute("hidden");
}

/**
 * Update the page status message with aria-live.
 * @param {string} message - Message to display.
 */
function setStatus(message) {
  const statusEl = document.getElementById("status-message");
  if (statusEl) statusEl.textContent = message || "";
}

/**
 * Safely set text content by element id.
 * @param {string} id - Element id.
 * @param {string} value - Text to set.
 */
function safeSetText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
}

/**
 * Populate quick link chips for repo/docs/chat, hiding when absent.
 * @param {{repo_url?: string, docs_url?: string, chat_url?: string}} links - Link URLs.
 */
function fillQuickLinks(links) {
  const { repo_url: repoUrl, docs_url: docsUrl, chat_url: chatUrl } = links || {};
  const repo = document.getElementById("repo-link");
  const docs = document.getElementById("docs-link");
  const chat = document.getElementById("chat-link");

  if (repo) {
    if (repoUrl) {
      repo.href = repoUrl;
      setHidden(repo, false);
    } else {
      setHidden(repo, true);
    }
  }
  if (docs) {
    if (docsUrl) {
      docs.href = docsUrl;
      setHidden(docs, false);
    } else {
      setHidden(docs, true);
    }
  }
  if (chat) {
    if (chatUrl) {
      chat.href = chatUrl;
      setHidden(chat, false);
    } else {
      setHidden(chat, true);
    }
  }
}

/**
 * Render tags into a container as pill elements.
 * @param {string} containerId - Target element id.
 * @param {Array<string>} tags - List of tags.
 */
function renderTags(containerId, tags) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.textContent = "";
  if (!Array.isArray(tags) || tags.length === 0) {
    container.textContent = "—";
    return;
  }
  tags.forEach((t) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = t;
    container.appendChild(span);
  });
}

/**
 * Render a key-value grid from an object.
 * @param {string} containerId - Target element id.
 * @param {Record<string,unknown>} obj - Object of metrics/properties.
 */
function renderKVList(containerId, obj) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.textContent = "";
  const entries = Object.entries(obj || {});
  if (entries.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No data available.";
    container.appendChild(p);
    return;
  }
  entries.forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "kv-list__row";
    const kEl = document.createElement("div");
    kEl.textContent = key.replace(/_/g, " ");
    const vEl = document.createElement("div");
    vEl.textContent = typeof value === "object" ? JSON.stringify(value) : String(value);
    row.appendChild(kEl);
    row.appendChild(vEl);
    container.appendChild(row);
  });
}

/**
 * Render a generic list where each item is mapped into a list item.
 * @template T
 * @param {string} containerId - Target UL id.
 * @param {Array<T>} items - Items to render.
 * @param {(li: HTMLLIElement, item: T) => void} mapFn - Mapper that fills the LI.
 */
function renderSimpleList(containerId, items, mapFn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.textContent = "";
  if (!Array.isArray(items) || items.length === 0) {
    const li = document.createElement("li");
    li.className = "list__item";
    li.textContent = "No items.";
    container.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "list__item";
    mapFn(li, item);
    container.appendChild(li);
  });
}

/**
 * Initialize the team details page:
 * - Reads team param
 * - Fetches profile via mock API
 * - Renders overview, metrics, members, meetings, updates, milestones, notes, resources
 */
async function init() {
  const teamUuid = getParam("team");
  if (!teamUuid) {
    setStatus("Missing team parameter.");
    safeSetText("team-title", "Team not found");
    return;
  }

  setStatus("Loading team…");
  try {
    const data = await getTeamProfile(teamUuid);
    const info = data?.team_info || {};

    // Header
    safeSetText("team-title", byDefined(info.team_name, "Project Team"));
    safeSetText("team-subtitle", byDefined(info.course_name, ""));
    fillQuickLinks(info);

    // Overview
    safeSetText("overview-team", byDefined(info.team_name));
    safeSetText("overview-course", byDefined(info.course_name));
    safeSetText("overview-project", byDefined(info.project_name));
    safeSetText("overview-mission", byDefined(info.mission));
    safeSetText("overview-summary", byDefined(info.summary));
    safeSetText("overview-status", byDefined(info.status_health, "Unknown"));
    safeSetText("overview-updated", formatDate(info.status_updated));
    renderTags("overview-tags", info.tags);

    // Metrics
    renderKVList("metrics-body", data.metrics);

    // Members
    renderSimpleList("members-list", data.members, (li, m) => {
      const title = document.createElement("p");
      title.className = "list__item-title";
      title.textContent = byDefined(m.name, "Member");
      const subtitle = document.createElement("p");
      subtitle.className = "list__item-subtitle";
      const bits = [
        byDefined(m.role, null),
        byDefined(m.pronouns, null),
        byDefined(m.email, null)
      ].filter(Boolean);
      subtitle.textContent = bits.join(" • ");
      li.appendChild(title);
      li.appendChild(subtitle);
    });

    // Meeting Schedule
    renderSimpleList("meetings-list", data.meeting_schedule, (li, mtg) => {
      const title = document.createElement("p");
      title.className = "list__item-title";
      title.textContent = byDefined(mtg.title, "Meeting");
      const subtitle = document.createElement("p");
      subtitle.className = "list__item-subtitle";
      subtitle.textContent = byDefined(mtg.schedule, "");
      li.appendChild(title);
      li.appendChild(subtitle);
    });

    // Recent Updates
    renderSimpleList("updates-list", data.recent_updates, (li, up) => {
      const title = document.createElement("p");
      title.className = "list__item-title";
      title.textContent = byDefined(up.title, "Update");
      const subtitle = document.createElement("p");
      subtitle.className = "list__item-subtitle";
      const date = formatDate(up.date);
      const summary = byDefined(up.summary, "");
      subtitle.textContent = date && summary ? `${date} • ${summary}` : date || summary || "";
      li.appendChild(title);
      li.appendChild(subtitle);
    });

    // Upcoming Milestones
    renderSimpleList("milestones-list", data.upcoming_milestones, (li, ms) => {
      const title = document.createElement("p");
      title.className = "list__item-title";
      title.textContent = byDefined(ms.title, "Milestone");
      const subtitle = document.createElement("p");
      subtitle.className = "list__item-subtitle";
      const due = byDefined(ms.due_date, "");
      const status = byDefined(ms.status, "");
      const parts = [due ? `Due ${formatDate(due)}` : "", status].filter(Boolean);
      subtitle.textContent = parts.join(" • ");
      li.appendChild(title);
      li.appendChild(subtitle);
    });

    // Status Notes
    renderSimpleList("notes-list", data.status_notes, (li, note) => {
      const title = document.createElement("p");
      title.className = "list__item-title";
      const sentiment = note.sentiment ? ` (${note.sentiment})` : "";
      title.textContent = `${byDefined(note.author, "Note")}${sentiment}`;
      const subtitle = document.createElement("p");
      subtitle.className = "list__item-subtitle";
      const date = formatDate(note.date);
      const text = byDefined(note.note, "");
      subtitle.textContent = date && text ? `${date} • ${text}` : date || text || "";
      li.appendChild(title);
      li.appendChild(subtitle);
    });

    // Resources
    const resourcesContainer = document.getElementById("resources-list");
    if (resourcesContainer) {
      resourcesContainer.textContent = "";
      const items = Array.isArray(data.resources) ? data.resources : [];
      if (items.length === 0) {
        const li = document.createElement("li");
        li.className = "list__item";
        li.textContent = "No resources.";
        resourcesContainer.appendChild(li);
      } else {
        items.forEach((r) => {
          const li = document.createElement("li");
          li.className = "list__item";
          const title = document.createElement("p");
          title.className = "list__item-title";
          title.textContent = byDefined(r.label, "Resource");
          const link = document.createElement("a");
          link.href = byDefined(r.url, "#");
          link.target = "_blank";
          link.rel = "noopener";
          link.textContent = byDefined(r.url, "");
          const subtitle = document.createElement("p");
          subtitle.className = "list__item-subtitle";
          subtitle.appendChild(link);
          li.appendChild(title);
          li.appendChild(subtitle);
          resourcesContainer.appendChild(li);
        });
      }
    }

    setStatus("");
  } catch (e) {
    setStatus("Failed to load team.");
    safeSetText("team-title", "Error loading team");
    void e;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

