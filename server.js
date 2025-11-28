const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {    
    res.status(200).json({
        status:true,
        message: "Hello Developers welcome, This is Ganesh from backend side!"
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
