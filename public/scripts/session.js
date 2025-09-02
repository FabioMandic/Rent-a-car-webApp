document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userDropdown = document.getElementById("userDropdown");
  const welcomeUser = document.getElementById("welcomeUser");
  const dropdownContent = document.getElementById("dropdown-content");
  const brandLogo = document.getElementById("brandLogo");
  const rezervacijeBtn = document.getElementById("rezervacijeBtn");

  if (user) {
    loginBtn.style.display = "none";
    registerBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    if (brandLogo) brandLogo.style.display = "none";

    userDropdown.style.display = "block";
    welcomeUser.textContent = `WELCOME, ${user.username.toUpperCase()}`;

    dropdownContent.innerHTML = "";

    if (user.role === "admin") {
      addDropdownLink("Mailbox", "zahtjevi.html");
      addDropdownLink("Dodaj vozilo", "#");
      if (rezervacijeBtn) rezervacijeBtn.style.display = "inline-block";
    } else if (user.role === "user") {
      addDropdownLink("Rezervacije", "rezervacije-user.html");
      addDropdownLink("Omiljena vozila", "omiljena.html");
      if (rezervacijeBtn) rezervacijeBtn.style.display = "none";
    }
  } else {
    loginBtn.style.display = "inline-block";
    registerBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    userDropdown.style.display = "none";
    if (brandLogo) brandLogo.style.display = "flex";
    if (rezervacijeBtn) rezervacijeBtn.style.display = "none";
  }

  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("user");
    window.location.href = "pocetna.html";
  });

  function addDropdownLink(text, href) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    dropdownContent.appendChild(link);
  }
});
