const express = require("express");
const cors = require("cors");

const investmentRoutes = require("./routes/investments");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Stock Portfolio Tracker API is running"
    });
});

app.use("/investments", investmentRoutes);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});