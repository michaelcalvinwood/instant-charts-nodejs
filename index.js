require('dotenv').config();
const listenPort = process.env.LISTEN_PORT;
const privateKeyPath = process.env.PRIVATE_KEY_PATH;
const fullchainPath = process.env.PUBLIC_CERT_PATH;

const express = require('express');
const https = require('https');
const cors = require('cors');
const fs = require('fs');

const formidable = require('formidable');

const app = express();
app.use(express.static('public'));
app.use(express.json({limit: '200mb'})); 
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.post('/csv', (req, res) => {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, data) {
        if (err) return console.error(err);
        console.log(data['File[]'].filepath);
        console.log(fields.chart);
        // const filePath = files.filetoupload.filepath;
        // console.log('files stored in', filePath);
        res.write('File uploaded');
        res.end();
    });
})
const httpsServer = https.createServer({
    key: fs.readFileSync(privateKeyPath),
    cert: fs.readFileSync(fullchainPath),
  }, app);
  

  httpsServer.listen(listenPort, () => {
    console.log(`HTTPS Server running on port ${listenPort}`);
});

