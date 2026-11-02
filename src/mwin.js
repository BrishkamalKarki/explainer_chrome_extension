
const toggle_el = document.querySelector('#toggle');
const container = document.querySelector('.container'); 

chrome.storage.local.get('theme', ({ theme }) => {
  const dark = theme === 'dark';
  container.classList.toggle('dark', dark);
  toggle_el.checked = dark;
});

toggle_el.addEventListener('change', ()=>{
  if (toggle_el.checked){
    chrome.storage.local.set({ theme: 'dark'});
  }
  else{
    chrome.storage.local.set({ theme: 'light'});
  }
  container.classList.toggle('dark', toggle_el.checked);
});

const btn = document.querySelector('#submit');
const explainer_win = document.querySelector('#win_ex');
const inpt_box = document.querySelector('#query');
btn.addEventListener('click', async () => {
  explainer_win.textContent = "thinking...";
  const query = inpt_box.value.trim();
  if (!query) {
    explainer_win.textContent = "Type something first.";
    return;
  }
  inpt_box.value = "";   
  try{
    explainer_win.textContent = await Explain(query);
  } catch(e){
    explainer_win.textContent = "Error: " + e.message;
  }
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
  return data.candidates[0].content.parts[0].text;
}