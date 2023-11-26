const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.use(cors());

app.get('/getDataFolders', (req, res) => {
    const dataPath = path.join(__dirname, 'data');
    fs.readdir(dataPath, { withFileTypes: true }, (err, entries) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).send('An error occurred while reading the data directory.');
        }

        const folders = [];
        entries.forEach(entry => {
            if (entry.isDirectory()) {
                const companyPath = path.join(dataPath, entry.name);
                const dates = fs.readdirSync(companyPath).filter(date => {
                    const datePath = path.join(companyPath, date);
                    return fs.statSync(datePath).isDirectory();
                });
                dates.forEach(date => folders.push(`${entry.name}/${date}`));
            }
        });

        res.json(folders);
    });
});

app.get('/getVisualizationData', (req, res) => {
    const companyFolder = req.query.folder;
    const companyPath = path.join(__dirname, 'data', companyFolder);

    fs.readdir(companyPath, (err, files) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).send('An error occurred while reading the company directory.');
        }

        const jsonData = {};
        files.forEach(file => {
            const filePath = path.join(companyPath, file);
            jsonData[file] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        });

        res.json(jsonData);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
