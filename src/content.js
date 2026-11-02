
var just_selected = false;
var popup_clicked = false;
let selectedText = "";
let drag_offset_x = 0, drag_offset_y = 0;

document.addEventListener("mousedown", (event)=>{
  const explainer_el = document.querySelector("#explainer");
  if (explainer_el && !explainer_el.contains(event.target)){
    explainer_el.remove();
    just_selected = false;
  }
});

document.addEventListener("mousedown", (event) => {
  const header_el = document.querySelector("#popup_header");
  const win_el = document.querySelector("#explainer-window");

  if (!header_el || !win_el || !header_el.contains(event.target)) {
    return;
  }

  const rect = win_el.getBoundingClientRect();

  drag_offset_x = event.clientX - rect.left;
  drag_offset_y = event.clientY - rect.top;

  popup_clicked = true;
  header_el.style.cursor = "grabbing";

  event.preventDefault();
});

// getting the selected text
document.addEventListener("mouseup", (event)=>{

  popup_clicked = false;
    
  const selected = window.getSelection();
  const selectedusrQuery = selected.toString().trim();
  if (selectedusrQuery) selectedText = selectedusrQuery;   

  if (just_selected){
    just_selected = false;
    return;
  }

  if (selectedusrQuery){
    document.querySelector("#explainer")?.remove();
    const range = selected.getRangeAt(0);
    const rects = range.getClientRects();
    const last = rects[rects.length - 1] || range.getBoundingClientRect();
    let left = last.right + 6;    
    let top  = last.bottom + 6;
    console.log(range, rects, last);
    const container = document.createElement("div");
    container.id = "explainer";

    Object.assign(container.style, {
      borderRadius: "50%",
      border: "none",
      position: "fixed",
      background: "transparent",
      top: `${top}px`,
      left: `${left}px`
    })

    const img_el = document.createElement("img");
    img_el.src = chrome.runtime.getURL("assets/images/search.png");
    img_el.width = 70;
    img_el.height = 70;
    img_el.id = "searcher";

    container.appendChild(img_el);

    document.body.appendChild(container);
    just_selected = true;
  }
}
)

document.addEventListener("mousemove", (event) => {
  const win_el = document.querySelector("#explainer-window");

  if (!win_el || !popup_clicked) return;

  win_el.style.left = `${event.clientX - drag_offset_x}px`;
  win_el.style.top = `${event.clientY - drag_offset_y}px`;
});

async function Explain(usrQuery) {
  const API_KEY = sys_req.API_KEY;
  const MODEL = 'gemini-3.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': API_KEY
    },
    body: JSON.stringify({
      contents: [
        { parts: [{ text: 'Explain this in simple language. Keep it short and avoid giving the answer in md:\n\n' + usrQuery }] }
      ]
    })
  });

  if (res.status === 429) throw new Error('Limit reached, try again later.');
  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();
  // return data;
  return data.candidates[0].content.parts[0].text;
}

document.addEventListener("click", (event)=>{
  const cross_el = document.querySelector("#close_btn");
  if (cross_el && cross_el.contains(event.target)){
    document.querySelector("#explainer")?.remove();
    document.querySelector("#explainer-window")?.remove();
  }
});

document.addEventListener("click", async (event) => {
  const img_el = document.querySelector("#searcher");

  if (!img_el || !img_el.contains(event.target)) return;

  const { theme } = await chrome.storage.local.get('theme');

  console.log("the theme in popup is ", theme);
  if (!theme){
    chrome.storage.local.set({ theme: 'light'});
  }

  const query = selectedText;  
  console.log("Searching dude, wait a moment!", query);
  img_el.remove();

  document.querySelector("#explainer")?.remove();
  document.querySelector("#explainer-window")?.remove();

  const window_el = document.createElement("div");
  const header_el = document.createElement("div");
  const close_btn = document.createElement("button");
  close_btn.id = "close_btn";
  header_el.id = "popup_header";
  Object.assign(header_el.style, {
    width: "60px",
    height: "8px",
    background: "orange",
    borderRadius: "9999px",
    margin: "0",              
    flexShrink: "0"
  });

  close_btn.textContent = "×";
  Object.assign(close_btn.style, {
    padding: "0",
    border: "none",
    background: "transparent",
    color: "orange",
    fontSize: "20px",
    lineHeight: "1",
    cursor: "pointer"
  });

  const sub_win_el = document.createElement("div");
  sub_win_el.appendChild(header_el);
  sub_win_el.appendChild(close_btn);
  window_el.appendChild(sub_win_el);
  sub_win_el.id = "header-win";
  window_el.id = "explainer-window";
  Object.assign(sub_win_el.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "10px",
    flexShrink: "0"          
  });

  Object.assign(window_el.style, {
    position: "fixed",
    right: "24px",
    bottom: "24px",
    width: "320px",
    height: "420px",            
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
    color: "#1f2937",
    border: "none",
    borderRadius: "18px",
    fontFamily: "system-ui, sans-serif",
    fontSize: "14px",
    padding: "12px 12px 16px"
  });

  const legend_el = document.createElement("legend");
  legend_el.textContent = "Explanation";
  Object.assign(legend_el.style,{
    color: "orange",
    marginLeft: "20px"
  });  

  const field_set = document.createElement("fieldset");
  field_set.id = "fielder";
  Object.assign(field_set.style, {
    flex: "1",                  
    minHeight: "0",           
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    border: "1px solid orange",
    backgroundColor: "#fffae8",
    margin: "0",
    padding: "8px 14px 14px"
  });

  const ans = document.createElement("p");
  ans.style.color = "black";
  ans.style.lineHeight = "1.5";
  ans.style.flex = "1";
  ans.style.minHeight = "0";
  ans.textContent = "Thinking...";
  ans.style.overflowY = "auto";   
  
  field_set.appendChild(legend_el);
  field_set.appendChild(ans);
  window_el.appendChild(field_set);
  document.body.appendChild(window_el);

  if (theme == "dark"){
    Object.assign(window_el.style, {
      background: "#111b27",
      color: "#e2e8f0",
      border: "1px solid #203548"
    });

    Object.assign(header_el.style, {
      background: "linear-gradient(to bottom, #0891b2, #0e7490)"
    });

    close_btn.style.color = "#22d3ee";
    legend_el.style.color = "#22d3ee";

    Object.assign(field_set.style, {
      border: "1px solid #164e63",
      backgroundColor: "#111b27"
    });
    ans.style.color = "#e2e8f0";
    ans.style.scrollbarColor = "#164e63 transparent";
  }

  try {
    ans.textContent = await Explain(query);
  } catch (e) {
    ans.textContent = "Error: " + e.message;
  }
});