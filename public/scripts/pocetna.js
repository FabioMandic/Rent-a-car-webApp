document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userDropdown = document.getElementById("userDropdown");
  const dropdownContent = document.getElementById("dropdown-content");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const brandLogo = document.getElementById("brandLogo");
  const welcomeUser = document.getElementById("welcomeUser");

  if (user) {
    welcomeUser.textContent = `WELCOME, ${user.username.toUpperCase()}`;
    userDropdown.style.display = "block";
    logoutBtn.style.display = "inline-block";
    loginBtn.style.display = "none";
    registerBtn.style.display = "none";
    brandLogo.style.display = "none";

    dropdownContent.innerHTML = "";

    if (user.role === "admin") {
      addDropdownLink("Mailbox", "zahtjevi.html");
      addDropdownLink("Dodaj vozilo", "vozila.html");
    } else {
      addDropdownLink("Rezervacije", "rezervacije-user.html");
      addDropdownLink("Omiljena vozila", "omiljena.html");
    }
  }

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "pocetna.html";
  });

  function addDropdownLink(text, href) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    dropdownContent.appendChild(link);
  }

  
  const searchForm = document.querySelector(".search-form");
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const location = document.getElementById("search-location").value;
    const fromDate = document.getElementById("from-date").value;
    const toDate = document.getElementById("to-date").value;

    if (!fromDate || !toDate) {
      alert("Molimo unesite oba datuma!");
      return;
    }

    
    window.location.href = `rezultati.html?location=${encodeURIComponent(location)}&from=${fromDate}&to=${toDate}`;
  });
});












