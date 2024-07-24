"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const os_1 = __importDefault(require("os"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_config_1 = require("./config/database.config");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const stripewebhook_routes_1 = __importDefault(require("./routes/stripewebhook.routes"));
dotenv_1.default.config();
// Database connection
(0, database_config_1.connectToDataBase)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.static(__dirname + '/public'));
app.use((0, morgan_1.default)('dev'));
// Use the modular Webhook setup before bodyParser
app.use('/stripe/webhook', stripewebhook_routes_1.default);
// Middleware to parse request bodies
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
// Use auth routes
app.use('/api/v1/auth', auth_routes_1.default);
/* USER */
//  API routes
app.use('/user/api/v1', [
    payment_routes_1.default,
    subscription_routes_1.default,
    user_routes_1.default,
]);
// Socket.IO setup
const server = http_1.default.createServer(app);
// Server Health check
app.get('/health', (req, res) => {
    try {
        const networkInterfaces = os_1.default.networkInterfaces();
        // Extract IPv4 addresses
        const IPv4Addresses = Object.values(networkInterfaces)
            .flat()
            .filter((interfaceInfo) => interfaceInfo !== undefined && interfaceInfo.family === 'IPv4')
            .map(interfaceInfo => interfaceInfo.address);
        if (mongoose_1.default.connection.name) {
            const message = {
                host: IPv4Addresses,
                message: 'Healthy',
                status: true,
                time: new Date(),
            };
            console.log(message);
            return res.status(200).json({ response: message });
        }
        else {
            const message = {
                host: IPv4Addresses,
                message: 'Unhealthy',
                status: false,
                time: new Date(),
            };
            console.log(message);
            return res.status(501).json({ response: message });
        }
    }
    catch (error) {
        return res.status(500).json({ response: error.message });
    }
});
app.get('/server/check', (req, res) => {
    res.send("Hi!...I am server, Happy to see you boss...");
});
// Internal server error handling middleware
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({
        status: 500,
        message: "Server Error",
        error: err.message
    });
});
// Page not found middleware
app.use((req, res, next) => {
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
