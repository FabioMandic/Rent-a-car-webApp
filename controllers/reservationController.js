const db = require('../config/db');


const createReservation = async (req, res) => {
  const { user_id, vehicle_id, start_date, end_date, location, status } = req.body;
  if (!user_id || !vehicle_id || !start_date || !end_date || !location) {
    return res.status(400).json({ message: 'Nedostaju obavezni podaci.' });
  }

  try {
    const statusToInsert = status === "confirmed" ? "confirmed" : "pending";

    await db.query(
      `INSERT INTO reservations (user_id, vehicle_id, start_date, end_date, status, location)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, vehicle_id, start_date, end_date, statusToInsert, location]
    );

    res.status(201).json({
      message: statusToInsert === 'confirmed'
        ? 'Rezervacija odmah potvrđena (admin).'
        : 'Rezervacija je kreirana i čeka potvrdu.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Greška na serveru.' });
  }
};


const getAllReservations = async (req, res) => {
  try {
    let query = `
      SELECT r.id, r.user_id, r.vehicle_id, r.start_date, r.end_date, r.status, r.location,
             u.username AS user_name, v.name AS vehicle_name, v.image_url
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN vehicles v ON r.vehicle_id = v.id
    `;

    const params = [];

    if (req.query.status) {
      query += ` WHERE r.status = ?`;
      params.push(req.query.status);
    }

    const [results] = await db.query(query, params);
    res.json(results);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Greška na serveru.' });
  }
};


const getUserReservations = async (req, res) => {
  const { userId } = req.params;

  try {
    const [results] = await db.query(`
      SELECT r.id, r.user_id, r.vehicle_id, r.start_date, r.end_date, r.status, r.location,
             v.name AS vehicle_name, v.image_url
      FROM reservations r
      JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.user_id = ?
      ORDER BY r.start_date DESC
    `, [userId]);

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Greška na serveru kod dohvaćanja rezervacija korisnika.' });
  }
};


const updateReservationStatus = async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Neispravan status.' });
  }

  try {
    const [result] = await db.query(
      'UPDATE reservations SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Rezervacija nije pronađena.' });
    }

    if (status === "confirmed") {
      const [selectedRes] = await db.query('SELECT * FROM reservations WHERE id = ?', [id]);
      if (selectedRes.length > 0) {
        const { vehicle_id, start_date, end_date } = selectedRes[0];
        await db.query(
          `DELETE FROM reservations 
           WHERE vehicle_id = ? AND status = 'pending' AND id != ?
             AND NOT (? > end_date OR ? < start_date)`,
          [vehicle_id, id, end_date, start_date]
        );
      }
    }

    res.json({ message: 'Status je ažuriran.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Greška na serveru.' });
  }
};


const deleteReservation = async (req, res) => {
  const id = req.params.id;
  const { userId, role } = req.body; 

  try {
    
    const [existing] = await db.query('SELECT * FROM reservations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Rezervacija nije pronađena.' });
    }

    const reservation = existing[0];

    
    if (role !== 'admin' && reservation.user_id !== userId) {
      return res.status(403).json({ message: 'Nemate ovlasti za brisanje ove rezervacije.' });
    }

    await db.query('DELETE FROM reservations WHERE id = ?', [id]);
    res.json({ message: 'Rezervacija je obrisana.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Greška na serveru.' });
  }
};

module.exports = {
  createReservation,
  getAllReservations,
  getUserReservations,
  updateReservationStatus,
  deleteReservation
};

