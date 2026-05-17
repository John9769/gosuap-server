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
        const now = new Date();
        const in30Days = new Date();
        in30Days.setDate(in30Days.getDate() + 30);

        const [totalVendors, activeVendors, pendingVendors, premiumVendors, totalAgents, expiringVendors] = await Promise.all([
            prisma.vendor.count(),
            prisma.vendor.count({ where: { status: 'ACTIVE' } }),
            prisma.vendor.count({ where: { status: 'PENDING' } }),
            prisma.vendor.count({ where: { isPremium: true, status: 'ACTIVE' } }),
            prisma.user.count({ where: { role: 'AGENT' } }),
            prisma.vendor.count({
                where: { status: 'ACTIVE', expiryDate: { gte: now, lte: in30Days } }
            }),
        ]);

        res.json({ totalVendors, activeVendors, pendingVendors, premiumVendors, totalAgents, expiringVendors, updatedAt: new Date() });
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
            data: { name, email, phone, password: hashedPassword, role: 'AGENT' }
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

const getExpiringVendors = async (req, res) => {
    try {
        const now = new Date();
        const in30Days = new Date();
        in30Days.setDate(in30Days.getDate() + 30);
        const vendors = await prisma.vendor.findMany({
            where: { status: 'ACTIVE', expiryDate: { gte: now, lte: in30Days } },
            include: {
                state: { select: { name: true } },
                agent: { select: { name: true, phone: true } },
            },
            orderBy: { expiryDate: 'asc' }
        });
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch expiring vendors." });
    }
};

const getAgentStats = async (req, res) => {
    try {
        const agents = await prisma.user.findMany({
            where: { role: 'AGENT' },
            include: {
                vendors: {
                    include: { state: { select: { name: true } } },
                    orderBy: { expiryDate: 'asc' }
                },
                payments: {
                    select: { amount: true, isVerified: true, paymentMonth: true, paymentYear: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        const now = new Date();
        const in30Days = new Date();
        in30Days.setDate(in30Days.getDate() + 30);

        const result = agents.map(agent => {
            const verifiedPayments = agent.payments.filter(p => p.isVerified);
            const totalCollected = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);

            const monthlyRevenue = {};
            verifiedPayments.forEach(p => {
                if (p.paymentMonth && p.paymentYear) {
                    const key = `${p.paymentYear}-${String(p.paymentMonth).padStart(2, '0')}`;
                    monthlyRevenue[key] = (monthlyRevenue[key] || 0) + p.amount;
                }
            });

            return {
                id: agent.id,
                name: agent.name,
                phone: agent.phone,
                email: agent.email,
                totalVendors: agent.vendors.length,
                activeVendors: agent.vendors.filter(v => v.status === 'ACTIVE').length,
                pendingVendors: agent.vendors.filter(v => v.status === 'PENDING').length,
                totalCollected,
                monthlyRevenue,
                vendors: agent.vendors.map(v => {
                    let expiryStatus = 'ok';
                    if (v.expiryDate) {
                        if (new Date(v.expiryDate) < now) expiryStatus = 'expired';
                        else if (new Date(v.expiryDate) <= in30Days) expiryStatus = 'expiring';
                    }
                    return {
                        id: v.id, shopName: v.shopName, shopPhone: v.shopPhone,
                        status: v.status, expiryDate: v.expiryDate,
                        expiryStatus, state: v.state?.name, isPremium: v.isPremium
                    };
                })
            };
        });

        result.sort((a, b) => b.activeVendors - a.activeVendors);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch agent stats." });
    }
};

// Admin resets any agent's password
const resetAgentPassword = async (req, res) => {
    try {
        const { agentId, newPassword } = req.body;

        if (!agentId || !newPassword) {
            return res.status(400).json({ error: "agentId and newPassword are required." });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: "Kata laluan mestilah sekurang-kurangnya 8 aksara." });
        }

        const agent = await prisma.user.findFirst({
            where: { id: agentId, role: 'AGENT' }
        });

        if (!agent) {
            return res.status(404).json({ error: "Agent not found." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: agentId },
            data: { password: hashedPassword }
        });

        res.json({ message: `Kata laluan ${agent.name} berjaya ditetapkan semula.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gagal menetapkan semula kata laluan." });
    }
};

module.exports = {
    getPendingApprovals, approveVendor, setPremium, getPlatformStats,
    createAgent, getActiveVendors, getExpiringVendors, getAgentStats, resetAgentPassword
};