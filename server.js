const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const bodyParser = require('body-parser');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Path to creds.json and signature image
const credsPath = path.join(__dirname, 'creds.json');
const signaturePath = path.join(__dirname, 'signature.png');

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static('public')); // Serve static files (like smtp-settings.html, etc.)
app.use(bodyParser.urlencoded({ extended: true }));

// Fetch SMTP settings
app.get('/smtp-settings', (req, res) => {
    try {
        const creds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
        res.json(creds);
    } catch (err) {
        res.json({ host: '', port: '', user: '', pass: '', secure: false });
    }
});

// Handle SMTP settings update and signature upload
app.post('/smtp-settings', upload.single('signature'), (req, res) => {
    const { host, port, user, pass, secure } = req.body;

    const smtpSettings = {
        host,
        port: parseInt(port, 10),
        user,
        pass,
        secure: secure === 'true' || secure === true,
    };

    try {
        // Write the updated SMTP settings to creds.json
        fs.writeFileSync(credsPath, JSON.stringify(smtpSettings, null, 2));

        // Handle signature file upload
        if (req.file) {
            const tempPath = req.file.path;
            fs.rename(tempPath, signaturePath, (err) => {
                if (err) throw err;
            });
        }

        res.status(200).json({ message: 'Settings updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Email sending route
app.post('/send-email', async (req, res) => {
    const { from, to, subject, message } = req.body;

    try {
        const creds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));

        const transporter = nodemailer.createTransport({
            host: creds.host,
            port: creds.port,
            secure: creds.secure, // true for 465, false for other ports
            auth: {
                user: creds.user,
                pass: creds.pass,
            },
        });

        const mailOptions = {
            from,
            to,
            subject,
            html: `
                <p>${message}</p>
                <br>
                <br>
                <img src="cid:emailSignature" alt="Email Signature">
            `,
            attachments: [
                {
                    filename: 'signature.png',
                    path: signaturePath,
                    cid: 'emailSignature',
                },
            ],
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (err) {
        console.error('Error sending email:', err);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
