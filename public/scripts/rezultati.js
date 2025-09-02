document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const logoutBtn = document.getElementById("logoutBtn");
  const welcomeUser = document.getElementById("welcomeUser");
  const userDropdown = document.getElementById("userDropdown");
  const dropdownContent = document.getElementById("dropdown-content");
  const brandLogo = document.getElementById("brandLogo");

  const heading = document.getElementById("selectedLocationHeading");
  const backgroundImage = document.getElementById("backgroundImage");

  const vehicleResults = document.getElementById("vehicleResults");
  const typeFilter = document.getElementById("typeFilter");

  const params = new URLSearchParams(window.location.search);
  const location = params.get("location");
  const fromDate = params.get("from");
  const toDate = params.get("to");

  let currentReservation = null;

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
      addDropdownLink("Dodaj vozilo", "#");
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

  heading.textContent = `LOKACIJA: ${location ? location.toUpperCase() : ""}`;
  const bgMap = {
    "Požega": "Pozega.png",
    "Đakovo": "Dakovo.png",
    "Osijek": "Osijek.png"
  };
  backgroundImage.src = `./images/${bgMap[location] || "background-home.png.png"}`;

  typeFilter.addEventListener("change", fetchAndDisplayVehicles);

  async function fetchAndDisplayVehicles() {
    const selectedType = typeFilter.value;
    let url = `/api/vehicles?location=${encodeURIComponent(location)}&from=${fromDate}&to=${toDate}`;
    if (selectedType !== "all") {
      url += `&type=${encodeURIComponent(selectedType)}`;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Greška pri dohvatu vozila");
      const vehicles = await response.json();

      vehicleResults.innerHTML = "";

      if (vehicles.length === 0) {
        vehicleResults.innerHTML = `<p style="color:white;">Nema dostupnih vozila za tražene parametre.</p>`;
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

        const actionBtn = document.createElement("button");
        actionBtn.classList.add("details-btn");

        if (user && user.role === "admin") {
          actionBtn.textContent = "Rezerviraj";
          actionBtn.addEventListener("click", () => {
            openReservationModal(vehicle.id, location, fromDate, toDate);
          });
        } else {
          actionBtn.textContent = "Details";
          actionBtn.addEventListener("click", () => {
            openDetailsModal(vehicle);
          });
        }

        card.appendChild(img);
        card.appendChild(info);
        card.appendChild(actionBtn);
        vehicleResults.appendChild(card);
      });
    } catch (error) {
      console.error("Greška kod dohvaćanja vozila:", error);
      vehicleResults.innerHTML = `<p style="color: red;">Greška pri dohvatu vozila.</p>`;
    }
  }

  // ==== Modal Admin ====
  const reservationModal = document.getElementById("reservationModal");
  const reservationMessage = document.getElementById("reservationMessage");
  const confirmReservationBtn = document.getElementById("confirmReservation");
  const cancelReservationBtn = document.getElementById("cancelReservation");

  function openReservationModal(vehicleId, location, fromDate, toDate) {
    currentReservation = { vehicle_id: vehicleId, location, start_date: fromDate, end_date: toDate };
    reservationMessage.textContent = `Jeste li sigurni da želite rezervirati vozilo u gradu "${location}" od ${fromDate} do ${toDate}?`;
    reservationModal.style.display = "flex";
  }

  cancelReservationBtn.addEventListener("click", () => {
    reservationModal.style.display = "none";
    currentReservation = null;
  });

  confirmReservationBtn.addEventListener("click", async () => {
    if (!currentReservation || !user || !user.id) return;

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          ...currentReservation,
          status: "confirmed"
        }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Rezervacija potvrđena!");
        reservationModal.style.display = "none";
        fetchAndDisplayVehicles();
      } else {
        alert(result.error || "Rezervacija nije uspjela.");
      }
    } catch (err) {
      console.error("Greška kod rezervacije:", err);
      alert("Došlo je do greške.");
    }
  });

  // ==== Modal User ====
  const vehicleModal = document.getElementById("vehicleModal");
  const closeVehicleModal = document.getElementById("closeVehicleModal");
  const modalReserveBtn = document.getElementById("modalReserveBtn");

  function openDetailsModal(vehicle) {
    document.getElementById("modalVehicleName").textContent = vehicle.name;
    document.getElementById("modalVehicleImage").src = vehicle.image_url.startsWith("car_images/")
      ? `./${vehicle.image_url}`
      : `./car_images/${vehicle.image_url}`;
    document.getElementById("modalVehicleImage").alt = vehicle.name;
    document.getElementById("modalPrice").textContent = vehicle.price_per_day;
    document.getElementById("modalLocation").textContent = vehicle.location;
    document.getElementById("modalType").textContent = vehicle.type;
    document.getElementById("modalPowerRange").textContent = vehicle.power_range || "N/A";
    document.getElementById("modalDescription").textContent = vehicle.description || "Nema opisa.";

    if (user && user.role === "user") {
      modalReserveBtn.style.display = "inline-block";
      modalReserveBtn.onclick = async () => {
        try {
          const response = await fetch("/api/reservations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: user.id,
              vehicle_id: vehicle.id,
              start_date: fromDate,
              end_date: toDate,
              location: location
            }),
          });

          const result = await response.json();
          if (response.ok) {
            alert("Zahtjev za rezervaciju poslan. Čeka potvrdu admina.");
            vehicleModal.style.display = "none";
            fetchAndDisplayVehicles();
          } else {
            alert(result.error || "Greška pri rezervaciji.");
          }
        } catch (err) {
          console.error(err);
          alert("Došlo je do greške.");
        }
      };
    } else {
      modalReserveBtn.style.display = "none";
      modalReserveBtn.onclick = null;
    }

    vehicleModal.style.display = "flex";
  }

  closeVehicleModal.addEventListener("click", () => {
    vehicleModal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === vehicleModal) {
      vehicleModal.style.display = "none";
    }
    if (event.target === reservationModal) {
      reservationModal.style.display = "none";
    }
  });

  fetchAndDisplayVehicles();
});
