const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { Kafka, logLevel } = require('kafkajs');

require('dotenv').config()

// Connected users (request object of each user) 
global.users = {};

const indexRouter = require('./routes/index');
const StreamRoutes = require('./routes/stream');
const KafkaRoutes = require('./routes/kafka');

const app = express();

const kafka = new Kafka({
    clientId: 'app',
    brokers: [process.env.KAFKA_HOST],
    logLevel: logLevel.ERROR,
    connectionTimeout: 3000,
    requestTimeout: 25000,
    retry: {
        initialRetryTime: 10000,
        retries: 2
    }
})

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
    req.on("close", () => {
        if (!res.writableEnded) {
            res.end();
            console.log("Stopped sending events.");
        }
    });
    next();
})

const streamRoutes = new StreamRoutes();
const kafkaRoutes = new KafkaRoutes();

app.use('/', indexRouter);
app.use('/stream', streamRoutes.init());
app.use('/kafka', kafkaRoutes.init(kafka));

module.exports = app;
