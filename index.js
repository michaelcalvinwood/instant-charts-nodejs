require('dotenv').config();
const listenPort = process.env.LISTEN_PORT;
const privateKeyPath = process.env.PRIVATE_KEY_PATH;
const fullchainPath = process.env.PUBLIC_CERT_PATH;

const express = require('express');
const https = require('https');
const cors = require('cors');
const fs = require('fs');

const formidable = require('formidable');
const mysql = require('mysql2');
const csvParse = require('csv-parse');
const { delimiter } = require('path');

const config = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  database: process.env.MYSQL_DATABASE,
  password: process.env.MYSQL_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0
}
console.log(config)

const pool = mysql.createPool(config);

// pool.query("SHOW DATABASES", function(err, rows, fields) {
//    if (err) return console.error(err);
//     console.log(rows);
// })


const app = express();
app.use(express.static('public'));
app.use(express.json({limit: '200mb'})); 
app.use(cors());


const detectDelimiter = (input) => {
    const lines = input.split("\n");
    let numPipes = 0;
    let numCommas = 0;
    for (let i = 0; i < lines.length; ++i) {
        numPipes += (lines[i].match(/\|/g) || []).length;
        numCommas += (lines[i].match(/,/g) || []).length;
    }

    if (numPipes > numCommas) return '|';

    return ',';
}

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.post('/csv', (req, res) => {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, data) {
        if (err) return console.error(err);
        const fileName = data['File[]'].filepath;
        
        let input = fs.readFileSync(fileName, "utf-8");
        if (!input) return res.status(400).json('no input')
        
        input = input.replaceAll("\r\n", "\n");

        const lines = input.split("\n");
        if (lines[0] === 'sep=,') {
            console.log("remove sep");
            lines.splice(0, 1);
           input = lines.join("\n");
        } else console.log('lines[0]', lines[0], lines[0].length)

        const delimiter = detectDelimiter(input);

        csvParse.parse(input, {delimiter}, (err, records) => {
            if (err) {
                res.status(401).json({err});
                console.error(err);
            }
            console.log(records);
            res.json(records);

            fs.unlinkSync(fileName);
        });
       
    });
});

app.get('/id/:id', (req, res) => {
    const id = req.params.id;
    const query = `SELECT option FROM charts WHERE id = '${id}'`;
    pool.query(query, function(err, rows, fields) {
        if (err) return res.status(400).json('database error');
        res.status(200).send(rows);
    })
})

app.post('/id/:id', (req, res) => {
    const id = req.params.id;
    const {title, subtitle, meta, option} = req.body;
    console.log('meta', meta);
    
    if (typeof option === 'undefined') return res.status(401).json('missing option');
    
    const query = `INSERT INTO charts (id, option) VALUES ('${id}', ${pool.escape(option)})`;
    pool.query(query, function(err, rows, fields) {
        if (err) {
            console.error(err);
            return res.status(400).json('database error');
        }
        res.status(200).json('success');
    })
})


const httpsServer = https.createServer({
    key: fs.readFileSync(privateKeyPath),
    cert: fs.readFileSync(fullchainPath),
  }, app);
  

  httpsServer.listen(listenPort, () => {
    console.log(`HTTPS Server running on port ${listenPort}`);
});

