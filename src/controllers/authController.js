const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');

// Register a new Agent/Admin
const register = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, phone, password: hashedPassword, role: role || 'AGENT' }
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
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

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

// Agent changes own password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Kata laluan semasa dan baharu diperlukan." });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: "Kata laluan baharu mestilah sekurang-kurangnya 8 aksara." });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ error: "User not found." });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ error: "Kata laluan semasa tidak tepat." });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        res.json({ message: "Kata laluan berjaya ditukar." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gagal menukar kata laluan." });
    }
};

module.exports = { register, login, changePassword };