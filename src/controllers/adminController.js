const { prisma } = require('../lib/prisma');

// 1. Get all shops waiting for approval
// This is what the Admin checks every morning to see new sign-ups.
const getPendingApprovals = async (req, res) => {
    try {
        const pending = await prisma.vendor.findMany({
            where: { 
                status: 'PENDING' 
            },
            include: { 
                agent: { 
                    select: { 
                        name: true, 
                        phone: true 
                    } 
                },
                state: true 
            }
        });
        res.json(pending);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch pending shops." });
    }
};

// 2. Approve a shop (The "Basic" subscription RM60/RM500)
// This flips the status to ACTIVE and sets the visibility expiry date.
const approveVendor = async (req, res) => {
    try {
        const { vendorId, months } = req.body; 

        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + (months || 1));

        const updatedVendor = await prisma.vendor.update({
            where: { id: vendorId },
            data: {
                status: 'ACTIVE',
                expiryDate: expiry
            }
        });

        res.json({ 
            message: "Shop is now LIVE and visible to users.", 
            updatedVendor 
        });
    } catch (error) {
        res.status(500).json({ error: "Approval process failed." });
    }
};

// 3. NEW: Premium Boost Logic (Additional Payment)
// This allows a shop to stay at the TOP of the newspaper.
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
            data: {
                isPremium: isPremium,
                premiumExpiry: pExpiry
            }
        });

        res.json({ 
            message: isPremium ? "Shop is now PREMIUM/BOOSTED" : "Premium removed", 
            updatedVendor 
        });
    } catch (error) {
        res.status(500).json({ error: "Could not update Premium status." });
    }
};

// 4. Platform Stats (The "Owner's Birds-Eye View")
// Tracks total growth and specifically premium revenue shops.
const getPlatformStats = async (req, res) => {
    try {
        // Count how many total shops are online
        const totalVendors = await prisma.vendor.count({ 
            where: { status: 'ACTIVE' } 
        });

        // Count how many are paying for the Premium boost
        const premiumVendors = await prisma.vendor.count({ 
            where: { 
                isPremium: true, 
                status: 'ACTIVE' 
            } 
        });

        // Count the active sales force
        const totalAgents = await prisma.user.count({ 
            where: { role: 'AGENT' } 
        });
        
        res.json({
            activeShops: totalVendors,
            premiumShops: premiumVendors,
            totalAgents: totalAgents,
            platformName: "GoSuap",
            updatedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate business stats." });
    }
};

module.exports = { 
    getPendingApprovals, 
    approveVendor, 
    setPremium, 
    getPlatformStats 
};