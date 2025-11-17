/** @module attendance/embedModal */

// This is used for embedding the meeting view in the list and calendar views
/**
 * Create (or reuse) a simple iframe-based embed modal component.
 * The returned object has the shape { el, frame, titleEl, show, hide }.
 *
 * @param {Object} [opts]
 * @param {string} [opts.id] - DOM id to use for the modal root
 * @param {string} [opts.title] - initial title text
 * @param {string} [opts.width] - css width for content
 * @param {string} [opts.maxWidth] - css maxWidth for content
 * @param {string} [opts.height] - css height for content
 * @returns {{el:HTMLElement,frame:HTMLIFrameElement,titleEl:HTMLElement,show:function(string,string):void,hide:function():void}}
 */
export function createEmbedModal(opts = {}) {
  const id = opts.id || "embed-modal";
  // don't create twice
  const existing = document.getElementById(id);
  if(existing) {
    return wrap(existing);
  }

  const modal = document.createElement("div"); modal.id = id; modal.className = "modal hidden";
  const content = document.createElement("div"); content.className = "modal-content"; content.style.width = opts.width || "90%"; content.style.maxWidth = opts.maxWidth || "900px"; content.style.height = opts.height || "80%";

  const header = document.createElement("div"); header.className = "modal-header"; header.style.display = "flex"; header.style.justifyContent = "space-between"; header.style.alignItems = "center"; header.style.gap = "12px";
  const title = document.createElement("h3"); title.id = id + "-title"; title.style.margin = "0"; title.textContent = opts.title || "Embed";
  const controls = document.createElement("div"); controls.style.marginLeft="auto"; controls.style.display="flex"; controls.style.gap="8px";
  const closeBtn = document.createElement("button"); closeBtn.className = "btn btn-danger"; closeBtn.textContent = "Close"; closeBtn.type = "button";
  controls.appendChild(closeBtn);
  header.appendChild(title); header.appendChild(controls);

  const bodyWrap = document.createElement("div"); bodyWrap.className = "modal-body"; bodyWrap.style.flex = "1 1 auto"; bodyWrap.style.display = "flex"; bodyWrap.style.flexDirection = "column"; bodyWrap.style.gap = "8px"; bodyWrap.style.marginTop = "8px";
  const iframe = document.createElement("iframe"); iframe.id = id + "-frame"; iframe.style.width = "100%"; iframe.style.height = "100%"; iframe.style.border = "0"; iframe.style.borderRadius = "6px";
  bodyWrap.appendChild(iframe);

  content.appendChild(header); content.appendChild(bodyWrap); modal.appendChild(content); document.body.appendChild(modal);

  /**
   * Show the modal and set the iframe src. If a title is provided it will
   * update the header title.
   * @param {string} [url] - url to load in the iframe
   * @param {string} [t] - optional title text
   * @returns {void}
   */
  function show(url, t) { if(t) title.textContent = t; if(url) iframe.src = url; modal.classList.remove("hidden"); }
  /**
   * Hide the modal and clear the iframe src to free resources.
   * @returns {void}
   */
  function hide() { modal.classList.add("hidden"); iframe.src = ""; }
  closeBtn.addEventListener("click", hide);

  /**
   * Wrap an existing modal DOM element and return the expected API so callers
   * can reuse modals created outside this module.
   * @param {HTMLElement} el - root modal element containing an <iframe>
   * @returns {{el:HTMLElement,frame:HTMLIFrameElement,show:function(string,string):void,hide:function():void}}
   */
  function wrap(el) {
    const f = el.querySelector("iframe");
    return { el, frame: f, show: (u,t)=>{ if(t) el.querySelector(".modal-header h3").textContent = t; if(f) f.src = u; el.classList.remove("hidden"); }, hide: ()=>{ el.classList.add("hidden"); if(f) f.src=""; } };
  }

  return { el: modal, frame: iframe, titleEl: title, show, hide };
}
