const express = require('express');
const hbs = require('express-handlebars');
const mysql = require('mysql');  //
const MongoClient = require('mongodb').MongoClient;   ///
const aws = require('aws-sdk');
const morgan = require('morgan');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const uuid = require('uuid');

const db = require('./dbutil');
const config = require('C:/Users/Carine/src/tmp/config(full)');
const { loadConfig, testConnections } = require('./initdb')
const conns = loadConfig(config);
const PORT = parseInt(process.argv[2] || process.env.APP_PORT || process.env.PORT) || 3000;
const fileUpload = multer({ dest: __dirname + '/tmp' });

// SQL

const app = express();
app.use(cors());
app.use(morgan('tiny'));
app.engine('hbs', hbs({defaultLayout: 'main.hbs'}));
app.set('view engine', 'hbs');

// Configure Routes


app.use(express.static(__dirname + '/public'));

testConnections(conns)
	.then(() => {
		app.listen(PORT,
			() => {
				console.info(`Application started on port ${PORT} at ${new Date()}`);
			}
		)
	})
	.catch(error => {
		console.error(error);
		process.exit(-1);
	})