(function(){
  const intentKey = "hib_l1_intentie";
  const doneKey   = "hib_l1_done";

  const intentEl = document.getElementById("intentie");
  const saveBtn  = document.getElementById("saveIntentie");
  const saveMsg  = document.getElementById("saveStatus");
  const doneBtn  = document.getElementById("markComplete");
  const doneMsg  = document.getElementById("completeStatus");

  // Restore
  if (intentEl && localStorage.getItem(intentKey)) {
    intentEl.value = localStorage.getItem(intentKey);
  }
  if (localStorage.getItem(doneKey) === "true") {
    doneMsg.textContent = "Les voltooid ✓";
  }

  // Save intentie
  saveBtn?.addEventListener("click", () => {
    const val = (intentEl?.value || "").trim();
    localStorage.setItem(intentKey, val);
    saveMsg.textContent = "Opgeslagen.";
    setTimeout(()=> saveMsg.textContent = "", 2000);
  });

  // Mark complete
  doneBtn?.addEventListener("click", () => {
    localStorage.setItem(doneKey, "true");
    doneMsg.textContent = "Les voltooid ✓";
  });
})();
