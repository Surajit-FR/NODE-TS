import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import os from 'os';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import http from 'http';
import dotenv from 'dotenv';
import { connectToDataBase } from './config/database.config';
import authRoutes from '../src/routes/auth.routes';
import paymentRoutes from '../src/routes/payment.routes';
import subscriptionRoutes from '../src/routes/subscription.routes';
import userRoutes from '../src/routes/user.routes';
// Stripe Webhook
import stripeWebhook from './routes/stripewebhook.routes';

dotenv.config();

// Database connection
connectToDataBase();

const app = express();

app.use(cors());
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Use the modular Webhook setup
app.use('/stripe/webhook', stripeWebhook);

// Use auth routes
app.use('/api/v1/auth', authRoutes);

/* USER */
//  API routes
app.use('/user/api/v1', [
    paymentRoutes,
    subscriptionRoutes,
    userRoutes,
]);

// Socket.IO setup
const server = http.createServer(app);

// Server Health check
app.get('/health', (req: Request, res: Response) => {
    try {
        const networkInterfaces = os.networkInterfaces();

        // Extract IPv4 addresses
        const IPv4Addresses = Object.values(networkInterfaces)
            .flat()
            .filter((interfaceInfo): interfaceInfo is os.NetworkInterfaceInfo =>
                interfaceInfo !== undefined && interfaceInfo.family === 'IPv4')
            .map(interfaceInfo => interfaceInfo.address);

        if (mongoose.connection.name) {
            const message = {
                host: IPv4Addresses,
                message: 'Healthy',
                status: true,
                time: new Date(),
            };
            console.log(message);
            return res.status(200).json({ response: message });
        } else {
            const message = {
                host: IPv4Addresses,
                message: 'Unhealthy',
                status: false,
                time: new Date(),
            };
            console.log(message);
            return res.status(501).json({ response: message });
        }
    } catch (error) {
        return res.status(500).json({ response: (error as Error).message });
    }
});

app.get('/server/check', (req: Request, res: Response) => {
    res.send("Hi!...I am server, Happy to see you boss...");
});

// Internal server error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.log(err);
    res.status(500).json({
        status: 500,
        message: "Server Error",
        error: err.message
    });
});

// Page not found middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
        status: 404,
        message: "Page Not Found"
    });
});

const PORT = process.env.PORT || 5000;
const HOST = `${process.env.HOST}:${PORT}` || `http://localhost:${PORT}`;

server.listen(PORT, () => {
    console.log(`Server Connected On Port ${HOST}`);
});