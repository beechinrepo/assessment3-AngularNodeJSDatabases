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

// TODO - Task 2
// Configure your databases
const db = require('./dbutil');
const config = require('C:/Users/Carine/src/tmp/config(full)');
const { loadConfig, testConnections } = require('./initdb')
const conns = loadConfig(config);
const PORT = parseInt(process.argv[2] || process.env.APP_PORT || process.env.PORT) || 3000;
const fileUpload = multer({ dest: __dirname + '/tmp' });

const app = express();
app.use(cors());
app.use(morgan('tiny'));
app.engine('hbs', hbs({defaultLayout: 'main.hbs'}));
app.set('view engine', 'hbs');

// SQL statements
const INSERT_NEW_SONG = 'insert into song_info(song_id, song_title, mp3_file, lyrics, listening_slots, countryCode) values (?, ?, ?, ?, ?, ?)'
const insertNewSong = db.mkQuery(INSERT_NEW_SONG)

const GET_SONG = 'select * from song_info where song_id = ?;'
const getSong = db.mkQueryFromPool(db.mkQuery(GET_SONG), conns.mysql);

// TODO - Task 3
// Song Upload
app.post('/song', fileUpload.single('song'),
    (req, resp) => {
        console.info('req.body: ', req.body);
        console.info('req.file: ', req.file);
        
        conns.mysql.getConnection(
            (err, conn) => {
                if (err){
                    return resp.status(500).type('text/plain').send(`Error ${err}`);
                }
                
                db.startTransaction(conn)
                .then (
                    //insert into MySQL DB
                    status => {
                        const song_id = uuid().substring(0,8);
                        const params = [
                            song_id, 
							req.body.song_title, 
							req.file.filename,  // mp3_file
                            req.body.lyrics, 
							req.body.listening_slots,
							req.body.countryCode  
                        ]
                        return (insertNewSong({connection:status.connection, params: params}));
                    }
                )
                // .then(db.passthru, db.logError)
                .then(status => 
                    new Promise(
                        (resolve, reject) => {
                            fs.readFile(req.file.path,(err, imgFile) => {
                                if (err)
                                    return reject({connection: status.connection, error: err})
                                const params = {
                                    Bucket: 'belloz', Key: `music/${req.body.countryCode}.mp3`,  // post photo on DO spaces 
                                    Body: imgFile, ContentType: req.file.mimetype,
                                    ContentLength:  req.file.size, ACL: 'public-read'
                                }
                                conns.s3.putObject(params, 
                                    (error, result) => {
                                        if (error)
                                            return reject({ connection: status.connection, error })
                                        resolve({ connection: status.connection, result })
                                    }
                                )
                            })
                        }
                    )
                )
                .then(db.commit, db.rollback) // success, fail (or .catch)
                .then(
                    (status)=>{
                        return new Promise(
                            (resolve, reject) =>{
                                fs.unlink(req.file.path, () =>{
                                    resp.status(201).type('text/plain').send(`Posted song: ${req.body.song_title}`);
                                    resolve;
                                })
                            }
                        )
                    },
                    (status)=>{
                        resp.status(400).type('text/plain').send(`Error ${status.error}`);
                    }
                )
                .finally(()=>conn.release);
            }
        )
    }
)

// TODO - Task 4
// List all songs 
app.use(
    (req,resp, next) => {
        resp.on('finish', () => {  // 1 song checkout
            conns.mongodb.db('music').collection('song_history')
                .insertOne({
					country_name: 'Singapore',
					flag: 'sg.png',	
					song_title: 'Belloz2',
					user: 'belloz2',
					listening_slots: 3,
					checkout: new Date(),
                })
                .then((result) => {
                    console.info('done');
                })
        })
        next();
    }
)

app.get('/songs',
    (req,resp, next) => {  // find the song history of Belloz1
		const p1 = conns.mongodb.db('music').collection('song_history') 
			.find({
				$and: [
					{ song_title: 'Belloz1' },
					{ checkout: { $exists: true} }
				]
			}).count();

		const p2 = conns.mongodb.db('music').collection('song_history') 
			.find({}).toArray();  //song_title: 'Belloz1'
		Promise.all([ p1, p2 ])
		.then(result => {
			console.log('result[1]: ', result[1]);
			const count = result[0];
			const others = result[1];
			const answer = others.map(v=> {
				console.log(v.listening_slots)
				const other = {
					country_name: v.country_name,
					flag: v.flag,
					song_title: v.song_title,
					listening_slots: v.listening_slots,
					checkout: count
				}
				return other
			})
			console.log('answer: ', answer[0])
			resp.status(200).type('text/html').render('songs', { songs: [answer[0]] });
		})
		.catch(error => {
			resp.status(500).type('text/plain').send(`Error ${error}`);
		})
	}
)

// TODO - Task 5
// List available songs for listening
app.use(
    (req,resp, next) => {
        resp.on('finish', () => {  // No listening slot
            conns.mongodb.db('music').collection('song_history')
                .insertOne({
					country_name: 'UK',
					flag: 'uk.png',	
					song_title: 'Belloz0',
					user: 'belloz0',
					listening_slots: 0,
					checkout: new Date(),
                })
                .then((result) => {
                    console.info('done');
                })
        })
        next();
    }
)

app.use(
    (req,resp, next) => {
        resp.on('finish', () => {  // Have available listening slots
            conns.mongodb.db('music').collection('song_history')
                .insertOne({
					country_name: 'jp',
					flag: 'jp.png',	
					song_title: 'Belloz5',
					user: 'belloz5',
					listening_slots: 5,
					checkout: new Date(),
                })
                .then((result) => {
                    console.info('done');
                })
        })
        next();
    }
)

app.get('/available',
    (req,resp, next) => {  
		const p1 = conns.mongodb.db('music').collection('song_history') 
			.find({}).toArray();
		Promise.all([ p1 ])
		.then(result => {
			console.log('result[0]: ', result[0]);
			const others = result[0];
			const answer = others.map(v=> {
				const other = {
					flag: v.flag,
					song_title: v.song_title,
					country_name: v.country_name,
                    listening_slots: v.listening_slots,
                    song_id: v.song_id
				}
				return other
			})
			console.log('answer: ', answer)
			resp.status(200).type('application/json').json(answer);   
		})
		.catch(error => {
			resp.status(500).type('text/plain').send(`Error ${error}`);
		})
	}
)

// TODO - Task 6
// Listening a song
app.get('/song/:song_id',
	(req, resp) => {
        const songId = req.params.song_id;
        getSong([songId])
        .then(result => {
            resp.status(200).type('application/json').json(result)
        })
        .catch(error => {
            resp.status(400).type('application/json').json({ error })
        })
    }
)

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
