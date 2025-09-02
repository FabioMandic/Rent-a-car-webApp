document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const container = document.getElementById("favoritesContainer");

  
  if (!user || !user.id) {
    container.innerHTML = `<p class="empty-state">Morate biti prijavljeni kako biste vidjeli omiljena vozila.</p>`;
    return;
  }


  const dropdownContent = document.getElementById("dropdown-content");
  if (dropdownContent) {
    dropdownContent.innerHTML = "";
    if (user.role === "admin") {
      addDropdownLink("Mailbox", "zahtjevi.html");
      addDropdownLink("Dodaj vozilo", "vozila.html");
    } else {
      addDropdownLink("Rezervacije", "rezervacije-user.html");
      addDropdownLink("Omiljena vozila", "omiljena.html");
    }
  }

  function addDropdownLink(text, href) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    dropdownContent.appendChild(link);
  }

  
  let favoriteIds = [];
  try {
    const res = await fetch(`/api/vehicles/favorites/${user.id}`);
    if (!res.ok) throw new Error("Neuspješan dohvat favorita");
    favoriteIds = await res.json(); 
  } catch (e) {
    console.error(e);
    container.innerHTML = `<p class="empty-state">Greška pri dohvaćanju omiljenih vozila.</p>`;
    return;
  }

  if (!favoriteIds.length) {
    container.innerHTML = `<p class="empty-state">Nemate omiljenih vozila.</p>`;
    return;
  }

  
  const vehicles = [];
  for (const id of favoriteIds) {
    try {
      const r = await fetch(`/api/vehicles/${id}`);
      if (!r.ok) continue;
      const v = await r.json();
      vehicles.push(v);
    } catch {}
  }

  if (!vehicles.length) {
    container.innerHTML = `<p class="empty-state">Nemate omiljenih vozila.</p>`;
    return;
  }

  container.innerHTML = "";
  vehicles.forEach((vehicle) => {
    const card = document.createElement("div");
    card.className = "favorite-card";

    const img = document.createElement("img");
    img.src = vehicle.image_url?.startsWith("car_images/")
      ? `./${vehicle.image_url}`
      : `./car_images/${vehicle.image_url}`;
    img.alt = vehicle.name || "Vozilo";

    const info = document.createElement("div");
    info.className = "favorite-info";
    info.innerHTML = `
      <p><strong>VOZILO:</strong> ${vehicle.name || "-"}</p>
      <p><strong>LOKACIJA:</strong> ${vehicle.location || "-"}</p>
      <p><strong>CIJENA PO DANU:</strong> ${vehicle.price_per_day ?? "-"} €</p>
    `;

    const actions = document.createElement("div");
    actions.className = "favorite-actions";

    const detailsBtn = document.createElement("button");
    detailsBtn.className = "details-btn";
    detailsBtn.textContent = "DETAILS";
    detailsBtn.addEventListener("click", () => openDetailsModal(vehicle.id));

    const heartBtn = document.createElement("button");
    heartBtn.className = "heart-btn";
    heartBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M12 21s-6-4.35-9-8.5C0 7.5 3 4 6.5 4 9 4 12 7 12 7s3-3 5.5-3C21 4 24 7.5 21 12.5c-3 4.15-9 8.5-9 8.5z"/>
      </svg>
    `;
    heartBtn.title = "Ukloni iz omiljenih";
    heartBtn.addEventListener("click", async () => {
      try {
        const r = await fetch("/api/vehicles/favorite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, vehicle_id: vehicle.id })
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          alert(data.message || "Greška pri ažuriranju omiljenih.");
          return;
        }
        
        if (data.favorite === false) {
          card.remove();
        
          if (!container.querySelector(".favorite-card")) {
            container.innerHTML = `<p class="empty-state">Nemate omiljenih vozila.</p>`;
          }
        }
      } catch (e) {
        console.error(e);
        alert("Greška pri povezivanju sa serverom.");
      }
    });

    actions.appendChild(detailsBtn);
    actions.appendChild(heartBtn);

    card.appendChild(img);
    card.appendChild(info);
    card.appendChild(actions);
    container.appendChild(card);
  });

  
  const modal = document.getElementById("vehicleModal");
  const closeModalBtn = document.getElementById("closeModal");

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => (modal.style.display = "none"));
  }
  window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

  async function openDetailsModal(vehicleId) {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`);
      if (!res.ok) throw new Error("Neuspješan dohvat podataka vozila");
      const v = await res.json();

      document.getElementById("modalVehicleName").textContent = v.name;
      document.getElementById("modalVehicleImage").src = v.image_url?.startsWith("car_images/")
        ? `./${v.image_url}`
        : `./car_images/${v.image_url}`;
      document.getElementById("modalVehicleImage").alt = v.name;
      document.getElementById("modalPrice").textContent = v.price_per_day ?? "-";
      document.getElementById("modalLocation").textContent = v.location ?? "-";
      document.getElementById("modalType").textContent = v.type ?? "-";
      document.getElementById("modalPowerRange").textContent = v.power_range || "N/A";
      document.getElementById("modalDescription").textContent = v.description || "Nema opisa.";

      modal.style.display = "flex";
    } catch (err) {
      console.error(err);
      alert("Greška pri dohvaćanju detalja vozila.");
    }
  }
});
