const { prisma } = require('../lib/prisma');
const bcrypt = require('bcrypt');

const getPendingApprovals = async (req, res) => {
    try {
        const pending = await prisma.vendor.findMany({
            where: { status: 'PENDING' },
            include: {
                agent: { select: { name: true, phone: true } },
                state: true
            }
        });
        res.json(pending);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch pending shops." });
    }
};

const approveVendor = async (req, res) => {
    try {
        const { vendorId, months } = req.body;

        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + (months || 1));

        const updatedVendor = await prisma.vendor.update({
            where: { id: vendorId },
            data: { status: 'ACTIVE', expiryDate: expiry }
        });

        res.json({ message: "Shop is now LIVE and visible to users.", updatedVendor });
    } catch (error) {
        res.status(500).json({ error: "Approval process failed." });
    }
};

const setPremium = async (req, res) => {
    try {
        const { vendorId, months, isPremium } = req.body;

        let pExpiry = null;
        if (isPremium) {
            pExpiry = new Date();
            pExpiry.setMonth(pExpiry.getMonth() + (months || 1));
        }

        const updatedVendor = await prisma.vendor.update({
            where: { id: vendorId },
            data: { isPremium, premiumExpiry: pExpiry }
        });

        res.json({
            message: isPremium ? "Shop is now PREMIUM/BOOSTED" : "Premium removed",
            updatedVendor
        });
    } catch (error) {
        res.status(500).json({ error: "Could not update Premium status." });
    }
};

const getPlatformStats = async (req, res) => {
    try {
        const [totalVendors, activeVendors, pendingVendors, premiumVendors, totalAgents] = await Promise.all([
            prisma.vendor.count(),
            prisma.vendor.count({ where: { status: 'ACTIVE' } }),
            prisma.vendor.count({ where: { status: 'PENDING' } }),
            prisma.vendor.count({ where: { isPremium: true, status: 'ACTIVE' } }),
            prisma.user.count({ where: { role: 'AGENT' } }),
        ]);

        res.json({
            totalVendors,
            activeVendors,
            pendingVendors,
            premiumVendors,
            totalAgents,
            updatedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate business stats." });
    }
};

const createAgent = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const agent = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                role: 'AGENT',
            }
        });

        res.status(201).json({
            message: "Agent created successfully.",
            agent: { id: agent.id, name: agent.name, email: agent.email, phone: agent.phone }
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "Email or phone already exists." });
    }
};

const getActiveVendors = async (req, res) => {
    try {
        const vendors = await prisma.vendor.findMany({
            where: { status: 'ACTIVE' },
            include: {
                state: { select: { name: true } },
                agent: { select: { name: true } },
            },
            orderBy: { shopName: 'asc' }
        });
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch active vendors." });
    }
};

// Agent performance leaderboard
const getAgentStats = async (req, res) => {
    try {
        const agents = await prisma.user.findMany({
            where: { role: 'AGENT' },
            include: {
                vendors: {
                    select: { status: true }
                },
                payments: {
                    where: { isVerified: true },
                    select: { amount: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        const result = agents.map(agent => ({
            id: agent.id,
            name: agent.name,
            phone: agent.phone,
            email: agent.email,
            totalVendors: agent.vendors.length,
            activeVendors: agent.vendors.filter(v => v.status === 'ACTIVE').length,
            pendingVendors: agent.vendors.filter(v => v.status === 'PENDING').length,
            totalCollected: agent.payments.reduce((sum, p) => sum + p.amount, 0),
        }));

        // Sort by active vendors descending
        result.sort((a, b) => b.activeVendors - a.activeVendors);

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch agent stats." });
    }
};

module.exports = {
    getPendingApprovals,
    approveVendor,
    setPremium,
    getPlatformStats,
    createAgent,
    getActiveVendors,
    getAgentStats
};