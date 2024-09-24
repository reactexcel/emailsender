const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');

// Path to the email signature image
const emailSignaturePath = path.join(__dirname, 'signature.png'); // Ensure the image is placed in the same directory

async function sendEmail({ from, to, subject, message }) {
    let creds;
    try {
        creds = JSON.parse(fs.readFileSync('creds.json', 'utf-8'));
    } catch (err) {
        console.error('Error loading credentials:', err);
        throw new Error('Failed to load SMTP credentials');
    }

    // Create a transporter object using the SMTP credentials
    const transporter = nodemailer.createTransport({
        host: creds.host,
        port: creds.port,
        secure: creds.secure, // true for 465, false for other ports
        auth: {
            user: creds.user, // SMTP user
            pass: creds.pass, // SMTP password
        },
    });

    // Email options
    const mailOptions = {
        from: from,
        to: to,
        subject: subject,
        html: `
            <p>${message}</p>
            <br>
            <br>
            <img src="cid:emailSignature" alt="Email Signature">
        `,
        attachments: [
            {
                filename: 'signature.png',
                path: emailSignaturePath,
                cid: 'emailSignature' // Same CID as in the HTML <img> tag
            }
        ]
    };

    // Send the email
    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
    } catch (err) {
        console.error('Error sending email:', err);
    }
}

module.exports = sendEmail;
