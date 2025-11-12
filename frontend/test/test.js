export async function loadCard(htmlPath, container) {
  try {
    const response = await fetch(htmlPath);
    const html = await response.text();
    
    const cardDiv = document.createElement('div');
    cardDiv.innerHTML = html;
    container.appendChild(cardDiv.firstElementChild);
  } catch (error) {
    console.error(`Failed to load card from ${htmlPath}:`, error);
  }
}