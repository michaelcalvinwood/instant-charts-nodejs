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

const config = {
 host: '127.0.0.1',
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

pool.query("SHOW DATABASES", function(err, rows, fields) {
   if (err) return console.error(err);
    console.log(rows);
})

// pool.getConnection((err, connection) => {
//   if(err)
//   throw err;
//   console.log('MYSQL connected successfully');
//   connection.release();
// });

// const query = query => {
//   return new Promise((resolve, reject) => {
//     pool.query(query, (err, data) => {
//       if(err) {
//         reject(err);
//         return;
//       }
//       resolve (data);
//     })
//   })
// }

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

