const express = require('express');
const { CompressionTypes } = require('kafkajs');
const router = express.Router();
const { SSE_RESPONSE_HEADER } = require('../contants')

class KafkaRoutes {
    constructor() {
        this.producer = null;
        this.consumer = null;
        this.keepAliveConnections();
    }

    init = (kafka) => {
        router.get('/subscribe/:id', (req, res, next) => {
            const { id } = req.params;
            global.users[id] = res;

            console.log('Connection successfully with user ' + id);
            res.writeHead(200, SSE_RESPONSE_HEADER);
            res.write(`data: [${id}] Connection successfully \n\n`);
        });

        router.get('/send/:id', async (req, res, next) => {
            const { id } = req.params;
            const { message } = req.query;
            const topic = process.env.KAFKA_TOPIC_MESSAGES;

            if (!this.consumer && !this.producer) {
                this.producer = kafka.producer();
                this.consumer = kafka.consumer({ groupId: process.env.KAFKA_CONSUMER_GROUP });

                await this.producer.connect();
                await this.consumer.connect();
                await this.consumer.subscribe({ topic })
            }

            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    //const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`
                    //console.log(`- ${prefix} ${message.key}#${message.value}`)
                    const [target, msg] = this.getMessage(message);

                    if (global.users[target] && !global.users[target].writableEnded) {
                        console.log('sending message...');
                        global.users[target].write("data: " + msg + "\n\n");
                    }
                }
            })

            this.producer.send({
                topic,
                compression: CompressionTypes.GZIP,
                messages: [this.createMessage(`${id}, ${message}`)]
            })
                //.then(console.log)
                .catch(console.error);

            const errorTypes = ['unhandledRejection', 'uncaughtException']
            const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

            errorTypes.map(type => {
                process.on(type, async () => {
                    try {
                        console.log(`process.on ${type}`)
                        await this.producer.disconnect()
                        process.exit(0)
                    } catch (_) {
                        process.exit(1)
                    }
                })
            })

            signalTraps.map(type => {
                process.once(type, async () => {
                    try {
                        await this.producer.disconnect()
                    } finally {
                        process.kill(process.pid, type)
                    }
                })
            })

            res.send("message send: " + message);
        })
        return router;
    }

    createMessage(message) {
        return {
            key: 'message-key',
            value: JSON.stringify(message),
        }
    }

    getMessage(message) {
        const data = JSON.parse(message.value);
        return data.split(",")
    }

    keepAliveConnections() {
        setInterval(() => {
            Object.entries(global.users).map(([id, res]) => {
                if (id && res) {
                    console.log('Keeping connection alive for user: ' + id);
                    res.write(`:\n\n`);
                }
            })
        }, 30000);
    }
}


module.exports = KafkaRoutes;