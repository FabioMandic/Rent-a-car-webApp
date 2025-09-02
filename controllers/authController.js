const db = require('../config/db');
const bcrypt = require('bcrypt');


const registerUser = async (req, res) => {
    console.log("POZVANA FUNKCIJA: registerUser");

    const { username, email, password, confirmPassword } = req.body;
    console.log("Podaci primljeni:", { username, email, password, confirmPassword });

    if (!username || !email || !password || !confirmPassword) {
        console.log("Nedostaju podaci");
        return res.status(400).json({ message: 'Sva polja su obavezna.' });
    }

    if (password !== confirmPassword) {
        console.log("Lozinke se ne podudaraju");
        return res.status(400).json({ message: 'Lozinke se ne podudaraju.' });
    }

    try {
        const [existingUser] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            console.log("Email već postoji");
            return res.status(409).json({ message: 'Email je već registriran.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Hashirana lozinka:", hashedPassword);

        await db.query(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, 'user']
        );

        console.log("Registracija uspješna");
        res.status(201).json({ message: 'Registracija uspješna.' });

    } catch (error) {
        console.error('Greška kod registracije:', error);
        res.status(500).json({ message: 'Greška na serveru.' });
    }
};


const loginUser = async (req, res) => {

    const { email, password } = req.body;
    if (!email || !password) {
        console.log("Nedostaje email ili lozinka");
        return res.status(400).json({ message: 'Sva polja su obavezna.' });
    }

    try {
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            console.log("Korisnik s tim emailom ne postoji");
            return res.status(401).json({ message: 'Neispravni podaci.' });
        }

        const user = users[0];
        console.log("Pronađen korisnik:", user.username);
        console.log("Hash iz baze:", user.password);

        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log("bcrypt.compare rezultat:", isPasswordValid);

        if (!isPasswordValid) {
            console.log("Lozinka nije ispravna");
            return res.status(401).json({ message: 'Neispravni podaci.' });
        }

        console.log("Prijava uspješna");
        res.status(200).json({
            message: 'Prijava uspješna.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Greška kod prijave:', error);
        res.status(500).json({ message: 'Greška na serveru.' });
    }
};

module.exports = {
    registerUser,
    loginUser
};