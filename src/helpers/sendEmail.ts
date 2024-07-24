import nodemailer from 'nodemailer';
import { SendEmailOptions, SendEmailResponse } from '../../types/types';
import { APP_PASSWORD, EMAIL_HOST, EMAIL_ID, EMAIL_PORT } from '../config/gmailApp.config';

export const SendEmail = async ({ receiver, subject, htmlContent }: SendEmailOptions): Promise<SendEmailResponse> => {
    try {
        // Initialize nodemailer
        const transporter = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: Number(EMAIL_PORT),
            secure: false,
            requireTLS: true,
            auth: {
                user: EMAIL_ID,
                pass: APP_PASSWORD
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
    } catch (exc: any) {
        console.log("Error sending email:", exc.message);
        return { success: false, message: "Service unavailable: Error sending email!" };
    }
};