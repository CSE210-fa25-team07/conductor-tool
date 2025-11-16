/** @module attendance/embedModal */

// This is used for embedding the meeting view in the list and calendar views
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

  function show(url, t) { if(t) title.textContent = t; if(url) iframe.src = url; modal.classList.remove("hidden"); }
  function hide() { modal.classList.add("hidden"); iframe.src = ""; }
  closeBtn.addEventListener("click", hide);

  function wrap(el) {
    const f = el.querySelector("iframe");
    return { el, frame: f, show: (u,t)=>{ if(t) el.querySelector(".modal-header h3").textContent = t; if(f) f.src = u; el.classList.remove("hidden"); }, hide: ()=>{ el.classList.add("hidden"); if(f) f.src=""; } };
  }

  return { el: modal, frame: iframe, titleEl: title, show, hide };
}
