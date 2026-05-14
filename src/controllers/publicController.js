const { prisma } = require('../lib/prisma');

// Get all ACTIVE shops in a specific state, sorted by Premium status AND Distance
const getNearbyShops = async (req, res) => {
    try {
        const { stateId, userLat, userLong } = req.query;

        // Fetch only Active shops that have not expired
        const shops = await prisma.vendor.findMany({
            where: {
                stateId: stateId,
                status: 'ACTIVE',
                expiryDate: {
                    gt: new Date()
                }
            },
            include: {
                menuItems: true
            }
        });

        const lat = parseFloat(userLat);
        const long = parseFloat(userLong);
        const hasGPS = !isNaN(lat) && !isNaN(long);

        // 1. Calculate distance only if GPS is available
        const processedShops = shops.map(shop => {
            const distance = hasGPS ? Math.sqrt(
                Math.pow(shop.latitude - lat, 2) +
                Math.pow(shop.longitude - long, 2)
            ) : null;
            return { ...shop, distance };
        });

        // 2. THE MULTI-LEVEL SORT (The Newspaper Logic)
        const sortedShops = processedShops.sort((a, b) => {
            if (a.isPremium && !b.isPremium) return -1;
            if (!a.isPremium && b.isPremium) return 1;
            if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
            return 0;
        });

        res.json(sortedShops);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Discovery failed to load shops." });
    }
};

// Get all States
const getStates = async (req, res) => {
    try {
        const states = await prisma.state.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(states);
    } catch (error) {
        res.status(500).json({ error: "Failed to load states." });
    }
};

// Get single vendor by ID for detail page
const getVendorById = async (req, res) => {
    try {
        const { id } = req.params;

        const vendor = await prisma.vendor.findFirst({
            where: {
                id,
                status: 'ACTIVE',
                expiryDate: { gt: new Date() }
            },
            include: {
                menuItems: true,
                state: { select: { name: true } }
            }
        });

        if (!vendor) {
            return res.status(404).json({ error: "Vendor not found or not active." });
        }

        res.json(vendor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to load vendor." });
    }
};

module.exports = { getNearbyShops, getStates, getVendorById };