const { prisma } = require('../lib/prisma');

// Agent submits payment receipt after collecting cash from vendor
const submitPayment = async (req, res) => {
    try {
        const { vendorId, amount, receiptImage } = req.body;

        if (!vendorId || !amount || !receiptImage) {
            return res.status(400).json({ error: "vendorId, amount and receiptImage are required." });
        }

        // Verify vendor belongs to this agent
        const vendor = await prisma.vendor.findFirst({
            where: { id: vendorId, agentId: req.user.id }
        });

        if (!vendor) {
            return res.status(403).json({ error: "Vendor not found or not yours." });
        }

        const payment = await prisma.paymentRecord.create({
            data: {
                amount: parseFloat(amount),
                receiptImage,
                isVerified: false,
                vendorId,
                agentId: req.user.id,
            },
            include: {
                vendor: { select: { shopName: true } }
            }
        });

        res.status(201).json({ message: "Payment submitted for verification.", payment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to submit payment." });
    }
};

// Admin verifies a payment record
const verifyPayment = async (req, res) => {
    try {
        const { paymentId } = req.body;

        if (!paymentId) {
            return res.status(400).json({ error: "paymentId is required." });
        }

        const payment = await prisma.paymentRecord.update({
            where: { id: paymentId },
            data: { isVerified: true }
        });

        res.json({ message: "Payment verified.", payment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to verify payment." });
    }
};

// Agent sees their own payment submissions
const getAgentPayments = async (req, res) => {
    try {
        const payments = await prisma.paymentRecord.findMany({
            where: { agentId: req.user.id },
            include: {
                vendor: { select: { shopName: true, shopImage: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch payments." });
    }
};

// Admin sees all unverified payments
const getPendingPayments = async (req, res) => {
    try {
        const payments = await prisma.paymentRecord.findMany({
            where: { isVerified: false },
            include: {
                vendor: { select: { shopName: true, shopImage: true } },
                agent: { select: { name: true, phone: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch pending payments." });
    }
};

module.exports = { submitPayment, verifyPayment, getAgentPayments, getPendingPayments };