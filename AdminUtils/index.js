require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { createClient } = require("@libsql/client");

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
}

const processRow = async (row, imageSourcePath) => {
    const uniqueImageName = `${uuidv4()}.jpg`;
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
}

processCsv("glist.csv", "std.jpg");//process.argv[2], process.argv[3]);