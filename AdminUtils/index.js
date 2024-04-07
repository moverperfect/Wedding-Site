require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { createClient } = require("@libsql/client");
const readline = require('readline');
const nodemailer = require('nodemailer');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const cleanKey = (key) => key.replace(/^\uFEFF/, '').trim();

const processCsv = (csvFilePath, imageSourcePath) => {
    const results = [];

    fs.createReadStream(csvFilePath)
        .pipe(csv({
            mapHeaders: ({ header, index }) => cleanKey(header)
        }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log('CSV file successfully processed');
            const processedRows = await Promise.all(results.map(row => processRow(row, imageSourcePath)));
            saveToDatabase(processedRows);
        });
};

const processRow = async (row, imageSourcePath) => {
    const uniqueImageName = `${uuidv4()}.png`;
    const targetPath = path.join(__dirname, 'images', uniqueImageName);

    fs.copyFileSync(imageSourcePath, targetPath);

    return { email: row.Email, name: row.Name, imageName: uniqueImageName };
};

async function saveToDatabase(rows) {
    const insertQuery = `
        INSERT INTO User (email, name, imageName) VALUES 
        ${rows.map(() => "(?, ?, ?)").join(",")}
    `;
    const args = rows.flatMap(row => [row.email, row.name, row.imageName]);

    await client.execute({
        sql: insertQuery,
        args: args,
    });

    console.log(`Batch saved to database: ${rows.length} records`);
};

const sendEmail = async () => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_AUTH_USERNAME,
            pass: process.env.EMAIL_AUTH_PASSWORD,
        },
    });

    try {
        const users = await client.execute("SELECT * FROM User WHERE email IS NOT '';");
        console.log(users.rows)
        for (const user of users.rows) {
            const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <body>
                <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto;">
                <tr>
                    <td style="text-align: center; padding: 20px;">
                    <img src="https://jackandeleanor.co.uk/invitation/${user.imageName}" alt="Save the Date" width="100%" style="max-width: 600px;">
                    <p style="font-family: 'Segoe UI';">Dear ${user.emailName},</p>
                    <br/>
                    <p style="font-family: 'Segoe UI';">Please save the date for our Wedding on 27th May 2025 at Wasing Park, Berkshire.</p>
                    <br/>
                    <p style="font-family: 'Segoe UI';">Invitations to follow,</p>
                    <p style="font-family: 'Segoe UI';">Jack and Eleanor</p>
                    </td>
                </tr>
                </table>
            </body>
            </html>
            `;

            console.log(`Preparing to send email to '${user.emailName}' (${user.email}).`);
            console.log('Content Preview:', htmlContent);

            const answer = await new Promise(resolve => {
                rl.question('Send this email? [y]es, [s]kip, [q]uit: ', (answer) => {
                    resolve(answer.toLowerCase());
                });
            });
            if (answer === 'y') {
                const mailOptions = {
                    from: '"Jack and Eleanor" <j.e.moorhouse@outlook.com>',
                    to: user.email,
                    subject: 'Save the Date | May 27th, 2025',
                    html: htmlContent,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(`Failed to send email to ${user.email}:`, error);
                        reject(error);
                    } else {
                        console.log(`Email sent to ${user.email}: %s`, info.messageId);
                    }
                });
            } else if (answer === 'q') {
                console.log('Quitting application.');
                break;
            } else if (answer === 's') {
                console.log(`Skipping ${user.email}.`);
                continue;
            }
        }

    } catch (error) {
        console.error("Failed to send emails: ", error);
    } finally {
        rl.close();
    };
}

rl.question('Choose function to execute (1: Process CSV, 2: Send Email): ', async (answer) => {
    switch (answer) {
        case '1':
            const csvFilePath = "glist2.csv";
            const imageSourcePath = "std-min.png";
            processCsv(csvFilePath, imageSourcePath);
            break;
        case '2':
            await sendEmail();
            break;
        default:
            console.log('Invalid option.');
    }
    rl.close();
});
