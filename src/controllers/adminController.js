const { prisma } = require('../lib/prisma');

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

module.exports = { getPendingApprovals, approveVendor, setPremium, getPlatformStats };