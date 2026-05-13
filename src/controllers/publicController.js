const { prisma } = require('../lib/prisma');

// Get all ACTIVE shops in a specific state, sorted by Premium status AND Distance
const getNearbyShops = async (req, res) => {
    try {
        const { stateId, userLat, userLong } = req.query;

        // Fetch only Active shops in the selected state
        const shops = await prisma.vendor.findMany({
            where: {
                stateId: stateId,
                status: 'ACTIVE' 
            },
            include: {
                menuItems: true 
            }
        });

        const lat = parseFloat(userLat) || 0;
        const long = parseFloat(userLong) || 0;

        // 1. Calculate the distance for every shop
        const processedShops = shops.map(shop => {
            const distance = Math.sqrt(
                Math.pow(shop.latitude - lat, 2) +
                Math.pow(shop.longitude - long, 2)
            );
            return { ...shop, distance };
        });

        // 2. THE MULTI-LEVEL SORT (The Newspaper Logic)
        const sortedShops = processedShops.sort((a, b) => {
            // First: Put Premium (isPremium: true) at the top
            if (a.isPremium && !b.isPremium) return -1;
            if (!a.isPremium && b.isPremium) return 1;

            // Second: If both are same status, show the closest one first
            return a.distance - b.distance;
        });

        res.json(sortedShops);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Discovery failed to load shops." });
    }
};

// Get all States (Ordered alphabetically for the user selection)
const getStates = async (req, res) => {
    try {
        const states = await prisma.state.findMany({
            orderBy: {
                name: 'asc'
            }
        });
        res.json(states);
    } catch (error) {
        res.status(500).json({ error: "Failed to load states." });
    }
};

module.exports = { getNearbyShops, getStates };