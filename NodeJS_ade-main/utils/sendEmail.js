const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        // Usage: Attach PDFKit-generated order receipt as attachment if needed
        // Example: attachments: [{ filename: 'OrderReceipt_123.pdf', content: pdfBuffer, contentType: 'application/pdf' }]
        // Parse port as number in case it's a string from env
        const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: smtpPort,
            secure: smtpPort === 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            },
            tls: {
                rejectUnauthorized: false // For development/testing
            }
        });

        const message = {
            from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
            to: options.email,
            subject: options.subject,
            html: `<p>${options.message}</p>`,
            attachments: options.attachments || []
        };

        console.log('Attempting to send email to:', options.email);
        const result = await transporter.sendMail(message);
        console.log('Email sent successfully:', result.messageId);
        return result;
    } catch (error) {
        console.error('Error in sendEmail function:', error);
        throw error;
    }
};

module.exports = sendEmail;
