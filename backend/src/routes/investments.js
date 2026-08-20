const express = require("express");
const router = express.Router();

const {
    addInvestment
} = require("../services/dynamo");

router.post("/", async (req, res) => {

    try {

        const {
            userId,
            investmentId,
            symbol,
            companyName,
            quantity,
            buyPrice,
            purchaseDate
        } = req.body;

        const investment = {
            userId,
            investmentId,
            symbol,
            companyName,
            quantity,
            buyPrice,
            purchaseDate,
            createdAt: new Date().toISOString()
        };

        await addInvestment(investment);

        res.status(201).json({
            message: "Investment added successfully",
            investment
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to add investment"
        });
    }
});

module.exports = router;