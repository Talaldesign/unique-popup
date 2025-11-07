
const adminPassword = "1234";
const sessionKey = "popupShown";

document.getElementById("loginBtn").addEventListener("click", ()=>{
  if(document.getElementById("adminPass").value === adminPassword){
    document.getElementById("adminPanel").style.display="block";
    document.getElementById("adminLogin").style.display="none";
  }
});

// load phrases
function loadPhrases(){
  const phrases = JSON.parse(localStorage.getItem("phrases")||"[]");
  const list = document.getElementById("phraseList");
  list.innerHTML="";
  phrases.forEach(p=>{
    const li=document.createElement("li");
    li.textContent=p;
    list.appendChild(li);
  });
}
loadPhrases();

document.getElementById("addPhraseBtn").addEventListener("click",()=>{
  const val = document.getElementById("phraseInput").value;
  if(!val) return;
  const phrases = JSON.parse(localStorage.getItem("phrases")||"[]");
  phrases.push(val);
  localStorage.setItem("phrases",JSON.stringify(phrases));
  document.getElementById("phraseInput").value="";
  loadPhrases();
});

document.getElementById("saveLinksBtn").addEventListener("click",()=>{
  localStorage.setItem("fb", document.getElementById("facebookInput").value);
  localStorage.setItem("tw", document.getElementById("twitterInput").value);
  localStorage.setItem("ig", document.getElementById("instagramInput").value);
});

// popup logic
window.onload = ()=>{
  if(sessionStorage.getItem(sessionKey)) return;
  const phrases = JSON.parse(localStorage.getItem("phrases")||"[]");
  if(phrases.length > 0){
    const phrase = phrases[Math.floor(Math.random()*phrases.length)];
    document.getElementById("popupPhrase").textContent = phrase;
    document.getElementById("fb").href = localStorage.getItem("fb")||"#";
    document.getElementById("tw").href = localStorage.getItem("tw")||"#";
    document.getElementById("ig").href = localStorage.getItem("ig")||"#";
    document.getElementById("popup").style.display="flex";
    sessionStorage.setItem(sessionKey,"1");
  }
};

document.getElementById("closePopup").addEventListener("click",()=>{
  document.getElementById("popup").style.display="none";
});
