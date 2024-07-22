import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

interface DBInfo {
    STATUS: string;
    HOST: string;
    DB_NAME: string;
    DATE_TIME: string;
}

const connectToDataBase = async (): Promise<void> => {
    try {
        console.log("Trying to connect to DB...");
        await mongoose.connect(process.env.DB_CONNECTION as string);

        // Get the current date and time
        const currentDate = new Date().toLocaleString();

        const dbInfo: DBInfo = {
            STATUS: "Connected",
            HOST: mongoose.connection.host,
            DB_NAME: mongoose.connection.name,
            DATE_TIME: currentDate,
        };

        console.table(dbInfo);
        console.log("MongoDB Connection Successful...");
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${(error as Error).message}`);
        process.exit(1); // Exit the process on connection failure
    }
};

export { connectToDataBase };
