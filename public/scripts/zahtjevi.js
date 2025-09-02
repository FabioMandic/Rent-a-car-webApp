document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const logoutBtn = document.getElementById("logoutBtn");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const welcomeUser = document.getElementById("welcomeUser");
  const userDropdown = document.getElementById("userDropdown");
  const dropdownContent = document.getElementById("dropdown-content");
  const brandLogo = document.getElementById("brandLogo");
  const requestsContainer = document.getElementById("requestsContainer");

  if (!user || user.role !== "admin") {
    alert("Pristup ovoj stranici imaju samo administratori.");
    window.location.href = "pocetna.html";
    return;
  }

  welcomeUser.textContent = `WELCOME, ${user.username.toUpperCase()}`;
  userDropdown.style.display = "block";
  logoutBtn.style.display = "inline-block";
  loginBtn.style.display = "none";
  registerBtn.style.display = "none";
  brandLogo.style.display = "none";

  dropdownContent.innerHTML = "";
  addDropdownLink("Mailbox", "zahtjevi.html");
  addDropdownLink("Dodaj vozilo", "#");

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

  async function fetchPendingRequests() {
    try {
      const response = await fetch("/api/reservations", {
        headers: {
          "Authorization": "Bearer " + btoa(JSON.stringify(user))
        }
      });
      if (!response.ok) throw new Error("Greška kod dohvaćanja rezervacija");

      const reservations = await response.json();

      const pendingReservations = reservations.filter(r => r.status === "pending");

      if (pendingReservations.length === 0) {
        requestsContainer.innerHTML = "<p style='color:white; text-align:center;'>Nema novih zahtjeva.</p>";
        return;
      }

      requestsContainer.innerHTML = "";

      pendingReservations.forEach(r => {
        const card = document.createElement("div");
        card.classList.add("request-card");

        card.innerHTML = `
          <div class="request-section request-image">
            <img src="./${r.image_url.startsWith("car_images/") ? r.image_url : "car_images/" + r.image_url}" alt="${r.vehicle_name}" />
          </div>
          <div class="request-section request-info">
            <p><strong>Vozilo:</strong> ${r.vehicle_name}</p>
            <p><strong>Od:</strong> ${new Date(r.start_date).toLocaleDateString("hr-HR")}</p>
            <p><strong>Do:</strong> ${new Date(r.end_date).toLocaleDateString("hr-HR")}</p>
            <p><strong>Lokacija:</strong> ${r.location}</p>
          </div>
          <div class="request-section request-actions">
            <p><img src="./images/user-icon.png" alt="User Icon" class="user-icon-inline-large"> ${r.user_name}</p>
            <div class="request-buttons">
              <button class="confirm-btn">Prihvati</button>
              <button class="reject-btn">Odbij</button>
            </div>
          </div>
        `;

        const confirmBtn = card.querySelector(".confirm-btn");
        const rejectBtn = card.querySelector(".reject-btn");

        confirmBtn.addEventListener("click", () => updateRequestStatus(r.id, "confirmed"));
        rejectBtn.addEventListener("click", () => deleteRequest(r.id, card));

        requestsContainer.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      requestsContainer.innerHTML = "<p style='color:red; text-align:center;'>Greška pri dohvaćanju zahtjeva.</p>";
    }
  }

  async function updateRequestStatus(id, status) {
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + btoa(JSON.stringify(user))
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error("Greška pri ažuriranju statusa.");

      alert(`Rezervacija ${status === "confirmed" ? "prihvaćena" : "odbijena"}.`);
      fetchPendingRequests();
    } catch (err) {
      console.error(err);
      alert("Greška pri ažuriranju statusa rezervacije.");
    }
  }

  async function deleteRequest(id, cardElement) {
    if (!confirm("Jeste li sigurni da želite odbiti ovu rezervaciju?")) return;

    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + btoa(JSON.stringify(user))
        },
        body: JSON.stringify({ status: "cancelled" })
      });
      if (!response.ok) throw new Error("Greška pri ažuriranju statusa.");

      alert("Rezervacija je odbijena.");
      cardElement.style.display = "none";
    } catch (err) {
      console.error(err);
      alert("Greška pri odbijanju rezervacije.");
    }
  }

  fetchPendingRequests();
});

