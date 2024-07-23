import nodemailer from 'nodemailer';
import { SendEmailOptions, SendEmailResponse } from '../../types/types';

export const SendEmail = async ({ receiver, subject, htmlContent }: SendEmailOptions): Promise<SendEmailResponse> => {
    try {
        // Initialize nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_APP_PASSWORD
            }
        });

        const mailOptions = {
            from: "Software support <no-reply@ariprodesign.com>",
            to: receiver,
            subject: subject,
            html: htmlContent
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log("Email sent:", info.messageId);
        return { success: true, message: "Email sent successfully!" };
    } catch (exc) {
        console.log("Error sending email:", (exc as Error).message);
        return { success: false, message: "Service unavailable: Error sending email!" };
    }
};