const { prisma } = require('../lib/prisma');

// Create a new Shop/Vendor (Agent only)
const createVendor = async (req, res) => {
    try {
        const { 
            shopName, shopPhone, address, latitude, longitude, 
            shopImage, isGrabFood, isFoodPanda, stateId, menuItems 
        } = req.body;

        // 1. Logic Check: Max 5 menu items constraint
        if (menuItems && menuItems.length > 5) {
            return res.status(400).json({ error: "Maximum 5 menu items allowed." });
        }

        // 2. Create the Vendor and the Menu Items together
        // We use req.user.id (from the auth middleware we will build next)
        const vendor = await prisma.vendor.create({
            data: {
                shopName,
                shopPhone,
                address,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                shopImage,
                isGrabFood: isGrabFood || false,
                isFoodPanda: isFoodPanda || false,
                status: 'PENDING', // Always pending until Admin approves
                stateId,
                agentId: req.user.id, // Linked to the agent who is logged in
                menuItems: {
                    create: menuItems // Array of { name, price, image }
                }
            },
            include: {
                menuItems: true // Return the menus in the response
            }
        });

        res.status(201).json({ message: "Shop onboarding submitted for approval", vendor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to onboard shop." });
    }
};

// Read-only: Get all shops for the Agent's Dashboard
const getAgentVendors = async (req, res) => {
    try {
        const vendors = await prisma.vendor.findMany({
            where: { agentId: req.user.id },
            include: { state: true }
        });
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ error: "Could not fetch your vendors." });
    }
};

module.exports = { createVendor, getAgentVendors };