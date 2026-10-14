import dotenv from 'dotenv';
dotenv.config()
import express from 'express';
import cors from 'cors';
import path from 'path'

const app = express();

//middleware to handle CORS
app.use( cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET" , "POST" , "PUT" , "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}) )

app.use(express.json());

const PORT = process.env.PORT || 5000

app.listen(PORT , () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
