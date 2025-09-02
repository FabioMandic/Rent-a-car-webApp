document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const logoutBtn = document.getElementById("logoutBtn");
  const welcomeUser = document.getElementById("welcomeUser");
  const userDropdown = document.getElementById("userDropdown");
  const dropdownContent = document.getElementById("dropdown-content");
  const brandLogo = document.getElementById("brandLogo");
  const container = document.getElementById("vehicles-container");

  const locationFilter = document.getElementById("location-filter");
  const typeFilter = document.getElementById("type-filter");
  const filterBtn = document.getElementById("filterBtn");

  const favoriteVehicles = new Set();
  const userId = user ? user.id : null;

  if (user) {
    welcomeUser.textContent = `WELCOME, ${user.username.toUpperCase()}`;
    userDropdown.style.display = "block";
    logoutBtn.style.display = "inline-block";
    document.getElementById("loginBtn").style.display = "none";
    document.getElementById("registerBtn").style.display = "none";
    brandLogo.style.display = "none";

    dropdownContent.innerHTML = "";
    if (user.role === "admin") {
      
      addDropdownLink("Mailbox", "zahtjevi.html");
      addDropdownLink("Dodaj vozilo", "vozila.html");
    } else {
      // user
      addDropdownLink("Rezervacije", "rezervacije-user.html");
      addDropdownLink("Omiljena vozila", "omiljena.html");
    }
  }

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "pocetna.html";
  });

  filterBtn.addEventListener("click", fetchAndDisplayVehicles);

  function addDropdownLink(text, href) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    dropdownContent.appendChild(link);
  }

  async function fetchFavorites() {
    if (!userId) return;
    try {
      const res = await fetch(`/api/vehicles/favorites/${userId}`);
      if (!res.ok) throw new Error('Ne mogu dohvatiti favorite');
      const favs = await res.json();
      favs.forEach(id => favoriteVehicles.add(id));
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchAndDisplayVehicles() {
    await fetchFavorites();

    const selectedLocation = locationFilter.value;
    const selectedType = typeFilter.value;

    let query = [];
    if (selectedLocation !== "all") query.push(`location=${encodeURIComponent(selectedLocation)}`);
    if (selectedType !== "all") query.push(`type=${encodeURIComponent(selectedType)}`);

    let url = "/api/vehicles";
    if (query.length > 0) url += "?" + query.join("&");

    try {
      const response = await fetch(url);
      const vehicles = await response.json();

      container.innerHTML = "";

      if (vehicles.length === 0) {
        container.innerHTML = `<p style="color: white;">Nema vozila za odabrani filter.</p>`;
        return;
      }

      vehicles.forEach((vehicle) => {
        const card = document.createElement("div");
        card.classList.add("vehicle-card");

        const img = document.createElement("img");
        img.src = vehicle.image_url.startsWith("car_images/")
          ? `./${vehicle.image_url}`
          : `./car_images/${vehicle.image_url}`;
        img.alt = vehicle.name;

        const info = document.createElement("div");
        info.classList.add("vehicle-info");
        info.innerHTML = `
          <p><strong>IME VOZILA:</strong> ${vehicle.name}</p>
          <p><strong>CIJENA PO DANU:</strong> ${vehicle.price_per_day} €</p>
        `;

        const detailsBtn = document.createElement("button");
        detailsBtn.classList.add("details-btn");
        detailsBtn.textContent = "DETAILS";

        card.appendChild(img);
        card.appendChild(info);
        card.appendChild(detailsBtn);

        if (user) {
          if (user.role === "admin") {
            const deleteBtn = document.createElement("button");
            deleteBtn.classList.add("delete-btn");
            deleteBtn.innerHTML = `<img src="./images/delete-icon.png" alt="X" />`;
            deleteBtn.addEventListener("click", () => deleteVehicle(vehicle.id, card));
            card.appendChild(deleteBtn);
          } else if (user.role === "user") {
            const heartBtn = document.createElement("button");
            heartBtn.classList.add("heart-btn");
            heartBtn.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" 
                   stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                   fill="${favoriteVehicles.has(vehicle.id) ? 'red' : 'white'}" 
                   class="heart-icon">
                <path d="M12 21s-6-4.35-9-8.5C0 7.5 3 4 6.5 4 9 4 12 7 12 7s3-3 5.5-3C21 4 24 7.5 21 12.5c-3 4.15-9 8.5-9 8.5z"/>
              </svg>
            `;

            heartBtn.addEventListener("click", async () => {
              try {
                const res = await fetch('/api/vehicles/favorite', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: userId, vehicle_id: vehicle.id })
                });
                const data = await res.json();
                if (res.ok) {
                  if (data.favorite) {
                    heartBtn.querySelector('svg').setAttribute('fill', 'red');
                    favoriteVehicles.add(vehicle.id);
                  } else {
                    heartBtn.querySelector('svg').setAttribute('fill', 'white');
                    favoriteVehicles.delete(vehicle.id);
                  }
                } else {
                  alert(data.message || "Greška pri ažuriranju omiljenih.");
                }
              } catch (error) {
                console.error(error);
                alert("Greška pri povezivanju sa serverom.");
              }
            });

            card.appendChild(heartBtn);
          }
        }

        container.appendChild(card);

        
        detailsBtn.addEventListener("click", async () => {
          try {
            const res = await fetch(`/api/vehicles/${vehicle.id}`);
            if (!res.ok) throw new Error("Neuspješan dohvat podataka vozila");
            const data = await res.json();

            document.getElementById("modalVehicleName").textContent = data.name;
            document.getElementById("modalVehicleImage").src = data.image_url.startsWith("car_images/")
              ? `./${data.image_url}`
              : `./car_images/${data.image_url}`;
            document.getElementById("modalVehicleImage").alt = data.name;
            document.getElementById("modalPrice").textContent = data.price_per_day;
            document.getElementById("modalLocation").textContent = data.location;
            document.getElementById("modalType").textContent = data.type;
            document.getElementById("modalPowerRange").textContent = data.power_range || "N/A";
            document.getElementById("modalDescription").textContent = data.description || "Nema opisa.";

            document.getElementById("vehicleModal").style.display = "flex";
          } catch (error) {
            alert("Greška pri dohvaćanju detalja vozila.");
            console.error(error);
          }
        });
      });
    } catch (error) {
      console.error("Greška kod dohvata vozila:", error);
      container.innerHTML = `<p style="color: red;">Greška pri dohvaćanju vozila.</p>`;
    }
  }

  async function deleteVehicle(id, cardElement) {
    if (!confirm("Jeste li sigurni da želite obrisati ovo vozilo?")) return;

    try {
      const token = btoa(JSON.stringify(user));

      const res = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        cardElement.remove();
        alert("Vozilo obrisano.");
      } else {
        alert(data.message || "Greška pri brisanju.");
      }
    } catch (err) {
      console.error("Greška:", err);
      alert("Došlo je do greške.");
    }
  }


  const modal = document.getElementById("vehicleModal");
  const closeModalBtn = document.getElementById("closeModal");

  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  
  fetchAndDisplayVehicles();
});

