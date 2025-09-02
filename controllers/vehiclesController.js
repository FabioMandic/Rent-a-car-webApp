const db = require('../config/db');
const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/car_images/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'vozilo-' + Date.now() + ext);
  }
});

const upload = multer({ storage: storage });

const getAllVehicles = async (req, res) => {
  const { location, type, from, to } = req.query;

  let sql = `SELECT * FROM vehicles WHERE 1=1`;
  const params = [];

  if (location && location !== 'all') {
    sql += ` AND location = ?`;
    params.push(location);
  }

  if (type && type !== 'all') {
    sql += ` AND type = ?`;
    params.push(type);
  }

  
  if (from && to) {
    sql += ` AND id NOT IN (
      SELECT vehicle_id FROM reservations
      WHERE status IN ('pending', 'confirmed')
      AND NOT (? > end_date OR ? < start_date)
    )`;
    params.push(from, to);
  }

  try {
    const [results] = await db.query(sql, params);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};



const getVehicleById = async (req, res) => {
  const vehicleId = req.params.id;
  try {
    const [results] = await db.query('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'Vozilo nije pronađeno' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

const deleteVehicle = async (req, res) => {
  const vehicleId = req.params.id;
  try {
    const [result] = await db.query('DELETE FROM vehicles WHERE id = ?', [vehicleId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vozilo nije pronađeno' });
    }
    res.json({ message: 'Vozilo obrisano' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

const addVehicle = async (req, res) => {
  const { name, type, power_range, location, price_per_day, description } = req.body;
  const imageFile = req.file;

  if (!imageFile) {
    return res.status(400).json({ message: 'Slika je obavezna.' });
  }

  try {
    const image_url = 'car_images/' + imageFile.filename;

    await db.query(
      'INSERT INTO vehicles (name, type, power_range, location, price_per_day, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, type, power_range, location, price_per_day, description, image_url]
    );

    res.status(201).json({ message: 'Vozilo uspješno dodano.' });
  } catch (error) {
    console.error('Greška kod dodavanja vozila:', error);
    res.status(500).json({ message: 'Greška na serveru.' });
  }
};


const toggleFavorite = async (req, res) => {
  const { user_id, vehicle_id } = req.body;
  if (!user_id || !vehicle_id) {
    return res.status(400).json({ message: 'Nedostaju podaci.' });
  }

  try {
    const [existing] = await db.query(
      'SELECT * FROM favorites WHERE user_id = ? AND vehicle_id = ?',
      [user_id, vehicle_id]
    );

    if (existing.length > 0) {
      
      await db.query(
        'DELETE FROM favorites WHERE user_id = ? AND vehicle_id = ?',
        [user_id, vehicle_id]
      );
      return res.json({ message: 'Uklonjeno iz omiljenih', favorite: false });
    } else {
      
      await db.query(
        'INSERT INTO favorites (user_id, vehicle_id) VALUES (?, ?)',
        [user_id, vehicle_id]
      );
      return res.json({ message: 'Dodano u omiljene', favorite: true });
    }
  } catch (err) {
    console.error('Greška u toggleFavorite:', err);
    res.status(500).json({ message: 'Greška na serveru.' });
  }
};


const getFavoritesByUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const [favorites] = await db.query(
      'SELECT vehicle_id FROM favorites WHERE user_id = ?',
      [userId]
    );
    res.json(favorites.map(fav => fav.vehicle_id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  deleteVehicle,
  addVehicle,
  upload,
  toggleFavorite,
  getFavoritesByUser
};


