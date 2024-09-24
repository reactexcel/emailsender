require('dotenv').config(); // Load environment variables from .env
const { SMTPClient } = require('smtp-client');

async function sendEmail({ from, to, subject, message }) {
    const client = new SMTPClient({
        host: process.env.SMTP_HOST, // Using SMTP host from .env
        port: parseInt(process.env.SMTP_PORT), // Using SMTP port from .env
        secure: true, // Port 465 requires SSL
    });

    try {
        // Connect to the SMTP server
        await client.connect();

        // Authenticate with the server
        await client.greet({ hostname: 'localhost' });
        await client.authPlain({
            username: process.env.SMTP_USER, // Using SMTP username from .env
            password: process.env.SMTP_PASS, // Using SMTP password from .env
        });

        // Sending email
        await client.mail({ from });
        await client.rcpt({ to });
        await client.data(`Subject: ${subject}\n\n${message}`);

        // Disconnect from the server
        await client.quit();
        console.log('Email sent successfully!');
    } catch (err) {
        console.error('Error sending email:', err);
    }
}

module.exports = sendEmail;
