const uuid = require('uuid');
const { Kafka } = require('kafkajs');
const SchemaRegistry = require('../../../schemaRegistry');

const kafka = new Kafka({
    clientId: 'accounting-service',
    brokers: [process.env.BROKER],
    logLevel: process.env.BROKER_LOG_LEVEL,
});

const producer = kafka.producer();

const publishTaskCompleted = (taskId, assignee) => {
    const event = {
        eventId: uuid.v4(),
        eventName: 'task-completed',
        eventTime: Date.now(),
        eventProducer: 'task-service',
        eventVersion: 1,
        data: {
            taskId,
            assignee,
        }
    };

    const schemaValidationResult = SchemaRegistry.validate(event);
    if (schemaValidationResult.valid) {
        return producer.send({
            topic: 'tasks',
            messages: [{
                value: JSON.stringify(event)
            }],
        });
    }
}

const publishTaskAssigned = (taskId, assignee) => {
    const event = {
        eventId: uuid.v4(),
        eventName: 'task-assigned',
        eventTime: Date.now(),
        eventProducer: 'task-service',
        eventVersion: 1,
        data: {
            taskId,
            assignee,
        }
    };

    const schemaValidationResult = SchemaRegistry.validate(event);
    if (schemaValidationResult.valid) {
        return producer.send({
            topic: 'tasks',
            messages: [{
                value: JSON.stringify(event)
            }],
        });
    }
}

module.exports = {
    connect: producer.connect,
    disconnect: producer.disconnect,
    publishTaskCompleted,
    publishTaskAssigned,
};