import Queue from 'bull';
import redisClient from '../config/redis';
import UserModel from '../model/user.model';
import { SendEmail } from '../helpers/sendEmail';
import { ReminderJobData } from '../../types/types';

const reminderQueue = new Queue<ReminderJobData>('reminder', {
    redis: {
        port: 6379,
        host: '127.0.0.1',
    },
});

reminderQueue.process(async (job) => {
    const { userId, subscriptionEndDate } = job.data;
    await sendReminder(userId, subscriptionEndDate);
});

// scheduleReminder
export const scheduleReminder = async (userEmail: string, subscriptionEndDate: Date): Promise<void> => {
    try {
        const user = await UserModel.findOne({ email: userEmail }).exec();

        if (!user) {
            console.error(`User not found for email: ${userEmail}`);
            return;
        }

        const userId: any = user._id;
        const reminderDate = new Date(subscriptionEndDate);
        reminderDate.setDate(reminderDate.getDate() - 3); // 3 days before subscription ends

        reminderQueue.add(
            { userId: userId.toString(), subscriptionEndDate },
            { delay: reminderDate.getTime() - Date.now() }
        );

        // Store the reminder schedule in Redis
        const reminderKey = `reminder:${userId}`;
        redisClient.set(reminderKey, subscriptionEndDate.toISOString());
    } catch (error) {
        console.error('Error fetching user details:', error);
    }
};

// sendReminder
export const sendReminder = async (userId: string, subscriptionEndDate: Date): Promise<void> => {
    try {
        const user = await UserModel.findById(userId).exec();

        if (user && user.email) {
            const userEmail = user.email;
            const subject = 'Subscription Reminder';
            const htmlContent = `<p>Your subscription will end on ${new Date(subscriptionEndDate).toDateString()}.</p>
                    <p>Please renew to continue enjoying our service.</p>`;

            SendEmail({ receiver: userEmail, subject, htmlContent });

            // Optionally, remove the reminder key from Redis after sending the reminder
            const reminderKey = `reminder:${userId}`;
            redisClient.del(reminderKey);
        } else {
            console.error(`User not found or email not available for user ID: ${userId}`);
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
    }
};