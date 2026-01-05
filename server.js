import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
import authRoutes from './routes/auth.js';
import contributorsRoutes from './routes/contributors.js';

app.use('/', authRoutes);
app.use('/contributors', contributorsRoutes);

app.get("/api", (req, res) => {    
    res.status(200).json({
        status:true,
        message: "Hello Developers welcome, This is Ganesh from backend side!"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
