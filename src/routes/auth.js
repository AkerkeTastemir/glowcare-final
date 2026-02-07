const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendEmail } = require('../mailer');
const { validateRegister, validateLogin } = require('../middleware');

const router = express.Router();

router.post('/register', validateRegister, async (req, res, next) => {
    try {
        const { email, password, username } = req.body;

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            email,
            password: hashedPassword,
            username
        });

        try {
            await sendEmail(
                user.email,
                'GlowCare registration complete!',
                `<h3>Welcome, ${user.username}!</h3>
            <p>Thanks for registering at GlowCare.</p><br>
            <p>Open <a href="https://glowcare-final.onrender.com">glowcare.com</a> to see more!</p>
            <p>Happy shopping!</p><br>
            <p>Best regards,</p>
            <p>GlowCare team.</p>`
            );
        } catch (err) {
            console.error('Email failed', err.message);
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({ token });
    } catch (err) {
        next(err);
    }
});

router.post('/login', validateLogin, async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
