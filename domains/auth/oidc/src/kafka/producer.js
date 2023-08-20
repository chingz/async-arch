const uuid = require('uuid')
const { Kafka } = require('kafkajs');

const SchemaRegistry = require('../../../../../schemaRegistry');

const kafka = new Kafka({
    clientId: 'auth-service',
    brokers: [process.env.BROKER],
    logLevel: process.env.BROKER_LOG_LEVEL,
});

const producer = kafka.producer();

const publishUserCreatedOrUpdated = (eventName, user) => {
    const event = {
        eventId: uuid.v4(),
        eventName: eventName,
        eventTime: Date.now(),
        eventProducer: 'oidc-service',
        eventVersion: 1,
        data: {
            username: user.username,
            email: user.email,
            role: user.role,
        }
    };

    const schemaValidationResult = SchemaRegistry.validate(event);
    if (schemaValidationResult.valid) {
        return producer.send({
            topic: 'users-stream',
            messages: [{
                value: JSON.stringify(event)
            }],
        });
    }
}

const publishUserDeleted = (user) => {
    const event = {
        eventId: uuid.v4(),
        eventName: 'user-deleted',
        eventTime: Date.now(),
        eventProducer: 'oidc-service',
        eventVersion: 1,
        data: { username: user.username }
    };

    const schemaValidationResult = SchemaRegistry.validate(event);
    if (schemaValidationResult.valid) {
        return producer.send({
            topic: 'users-stream',
            messages: [{
                value: JSON.stringify(event)
            }],
        });
    }
}

module.exports = {
    connect: producer.connect,
    disconnect: producer.disconnect,
    publishUserCreatedOrUpdated,
    publishUserDeleted,
};