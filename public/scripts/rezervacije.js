document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const container = document.getElementById("reservationsContainer");

  const showMsg = (html) => (container.innerHTML = html);

  if (!user || String(user.role).toLowerCase() !== "admin") {
    showMsg(`<p style="color:white;font-size:18px;">Nemate ovlasti za pregled rezervacija.</p>`);
    return;
  }

  
  showMsg(`<p style="color:white;font-size:18px;">Učitavam potvrđene rezervacije…</p>`);


  const fmtDate = (d) => {
    const x = new Date(d);
    return isNaN(x) ? (d ?? "-") : x.toLocaleDateString("hr-HR");
  };

  
  const imgPath = (p) => {
    if (!p) return "./images/default-car.jpg";
    return p.startsWith("car_images/") ? `./${p}` : `./car_images/${p}`;
  };

  async function fetchReservations(url) {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + btoa(JSON.stringify(user)),
      },
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error("Unauthorized");
    }
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error("Neuspješan dohvat: " + txt);
    }
    return res.json();
  }

  try {
    let reservations = [];
    try {
      reservations = await fetchReservations("/api/reservations?status=confirmed");
      console.log("[rezervacije] confirmed =>", reservations);
    } catch (e1) {
      console.warn("Greška s ?status=confirmed:", e1);
    }

    if (!Array.isArray(reservations) || reservations.length === 0) {
    
      try {
        const all = await fetchReservations("/api/reservations");
        console.log("[rezervacije] fallback all =>", all);
      
        reservations = (Array.isArray(all) ? all : []).filter(r => String(r.status).toLowerCase() === "confirmed");
      } catch (e2) {
        console.error("Greška s /api/reservations:", e2);
        showMsg(`<p style="color:white;font-size:18px;">Greška pri učitavanju podataka.</p>`);
        return;
      }
    }

    if (!reservations || reservations.length === 0) {
      showMsg(`<p style="color:white;font-size:18px;">Nema potvrđenih rezervacija.</p>`);
      return;
    }

    container.innerHTML = "";
    reservations.forEach((r) => {
      const card = document.createElement("div");
      card.className = "request-card";
      card.innerHTML = `
        <div class="request-section request-image">
          <img src="${imgPath(r.image_url)}" alt="${r.vehicle_name || "Vozilo"}" />
        </div>
        <div class="request-section request-info">
          <p><strong>Vozilo:</strong> ${r.vehicle_name || "-"}</p>
          <p><strong>Od:</strong> ${fmtDate(r.start_date)}</p>
          <p><strong>Do:</strong> ${fmtDate(r.end_date)}</p>
          <p><strong>Lokacija:</strong> ${r.location || "-"}</p>
        </div>
        <div class="request-section request-actions">
          <p>
            <img src="./images/user-icon.png" alt="User Icon" class="user-icon-inline-large">
            ${r.user_name || "-"}
          </p>
          <div
            style="
              width:56px;height:56px;border-radius:50%;
              background:#28a745;display:flex;align-items:center;justify-content:center;
              color:#fff;font-weight:700;font-size:24px;box-shadow:0 2px 6px rgba(0,0,0,.3);
            "
            title="Prihvaćeno"
          >&#10004;</div>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Greška pri dohvatu rezervacija:", err);
    if (String(err.message).includes("Unauthorized")) {
      showMsg(`<p style="color:white;font-size:18px;">Nemate ovlasti za pregled rezervacija.</p>`);
    } else {
      showMsg(`<p style="color:white;font-size:18px;">Greška pri učitavanju podataka.</p>`);
    }
  }
});


