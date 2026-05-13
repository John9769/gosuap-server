const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');

// Register a new Agent/Admin
const register = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;

        // Hash the password so it's not stored in plain text
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                role: role || 'AGENT'
            }
        });

        res.status(201).json({ message: "User created successfully", userId: user.id });
    } catch (error) {
        res.status(400).json({ error: "Email or Phone already exists" });
    }
};

// Login for Agents
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        // Create a Token (JWT) for the agent to stay logged in
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'gosuap_secret_key',
            { expiresIn: '7d' }
        );

        res.json({
            message: "Login successful",
            token,
            user: { id: user.id, name: user.name, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
};

module.exports = { register, login };