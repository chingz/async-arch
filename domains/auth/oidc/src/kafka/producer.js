const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'auth-service',
    brokers: [process.env.BROKER],
    logLevel: process.env.BROKER_LOG_LEVEL,
});

const producer = kafka.producer();

const publishUserCreatedOrUpdated = (event, user) => {
    return producer.send({
        topic: 'users-stream',
        messages: [{
            value: JSON.stringify({ event, user, created_at: Date.now() })
        }],
    })
}

const publishUserDeleted = (user) => {
    return producer.send({
        topic: 'users-stream',
        messages: [{
            value: JSON.stringify({
                event: 'user-deleted',
                username: user.username,
                created_at: Date.now()
            })
        }],
    })
}

module.exports = {
    connect: producer.connect,
    disconnect: producer.disconnect,
    publishUserCreatedOrUpdated,
    publishUserDeleted,
};