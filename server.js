require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sendEmail = require('./smtpClient');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Endpoint to send email
app.post('/send-email', async (req, res) => {
    const { from, to, subject, message } = req.body;

    // Handle missing fields error
    if (!from || !to || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        await sendEmail({ from, to, subject, message });
        res.status(200).json({ success: 'Email sent successfully!' });
    } catch (error) {
        console.error(error);
        if (error.message.includes('Invalid login')) {
            return res.status(401).json({ error: 'SMTP authentication failed. Check credentials.' });
        } else if (error.message.includes('Connection')) {
            return res.status(500).json({ error: 'Unable to connect to the SMTP server.' });
        } else {
            return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
        }
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
