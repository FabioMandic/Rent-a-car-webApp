 document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const modal = document.getElementById("addVehicleModal");
  const closeBtn = document.getElementById("closeAddVehicleModal");
  const form = document.getElementById("addVehicleForm");

  
  const dropdownContent = document.getElementById("dropdown-content");
  dropdownContent.addEventListener("click", (e) => {
    if (e.target && e.target.textContent === "Dodaj vozilo") {
      e.preventDefault();
      if (user && user.role === "admin") {
        modal.style.display = "flex";
      } else {
        alert("Nemate ovlasti za dodavanje vozila.");
      }
    }
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!user || user.role !== "admin") {
      alert("Nemate ovlasti za dodavanje vozila.");
      return;
    }

    const formData = new FormData(form);

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + btoa(JSON.stringify(user)),
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert("Vozilo dodano uspješno!");
        form.reset();
        modal.style.display = "none";
      } else {
        alert(data.message || "Greška pri dodavanju vozila");
      }
    } catch (error) {
      alert("Greška pri slanju podataka.");
      console.error(error);
    }
  });
});



