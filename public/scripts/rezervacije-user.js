document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("userReservationsContainer");

  
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.id) {
    container.innerHTML = "<p>Morate biti prijavljeni da biste vidjeli rezervacije.</p>";
    return;
  }

  
  const modal = document.getElementById("deleteModal");
  const confirmBtn = document.getElementById("confirmDelete");
  const cancelBtn = document.getElementById("cancelDelete");
  const backdrop = modal ? modal.querySelector(".modal-backdrop") : null;
  const modalSubtitle = document.getElementById("modalSubtitle");

  let selectedReservationId = null;
  let selectedCardEl = null;

  const openModal = (reservationId, cardEl, status) => {
    if (!modal) return;
    selectedReservationId = reservationId;
    selectedCardEl = cardEl;

    
    if (status === "confirmed") {
      modalSubtitle.textContent = "! Potvrda otkazivanja prihvacene rezervacije";
    } else if (status === "pending") {
      modalSubtitle.textContent = "! Potvrda brisanja zahtjeva poslane rezervacije";
    } else if (status === "cancelled") {
      modalSubtitle.textContent = "! Potvrda brisanja odbijene rezervacije";
    } else {
      modalSubtitle.textContent = "";
    }

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  };

  const closeModal = () => {
    if (!modal) return;
    selectedReservationId = null;
    selectedCardEl = null;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  };

  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  if (backdrop) backdrop.addEventListener("click", closeModal);

  
  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      if (!selectedReservationId) return;
      try {
        const res = await fetch(`/api/reservations/${selectedReservationId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, role: user.role })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.message || "Greška pri brisanju rezervacije.");
          return;
        }

        if (selectedCardEl && selectedCardEl.parentElement) {
          selectedCardEl.parentElement.removeChild(selectedCardEl);
        }
        
        if (!container.querySelector(".reservation-card")) {
          container.innerHTML = "<p>Nemate nijednu rezervaciju.</p>";
        }
        closeModal();
      } catch (e) {
        console.error(e);
        alert("Greška na mreži.");
      }
    });
  }


  try {
    const res = await fetch(`/api/reservations/user/${user.id}`);
    const reservations = await res.json();

    if (!reservations.length) {
      container.innerHTML = "<p>Nemate nijednu rezervaciju.</p>";
      return;
    }

    reservations.forEach(r => {
      const card = document.createElement("div");
      card.classList.add("reservation-card");

      
      let icon = "";
      if (r.status === "confirmed") icon = `<span class="status-icon status-confirmed">✅</span>`;
      else if (r.status === "pending") icon = `<span class="status-icon status-pending">⏳</span>`;
      else if (r.status === "cancelled") icon = `<span class="status-icon status-cancelled">❌</span>`;

      const start = new Date(r.start_date);
      const end = new Date(r.end_date);

      card.innerHTML = `
        <div>
          <img src="${r.image_url}" alt="${r.vehicle_name}" />
          <div class="reservation-info">
            <h3>${r.vehicle_name}</h3>
            <p><strong>Lokacija:</strong> ${r.location}</p>
            <p><strong>Od:</strong> ${isNaN(start) ? r.start_date : start.toLocaleDateString()}</p>
            <p><strong>Do:</strong> ${isNaN(end) ? r.end_date : end.toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${r.status}</p>
            ${icon}
          </div>
        </div>
      `;

      
      card.addEventListener("click", () => openModal(r.id, card, r.status));

      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Greška pri učitavanju rezervacija.</p>";
  }
});


