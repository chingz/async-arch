const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'accounting-service',
    brokers: [process.env.BROKER],
    logLevel: process.env.BROKER_LOG_LEVEL,
});

const producer = kafka.producer();

const publishTaskCreated = (task) => {
    return producer.send({
        topic: 'tasks-stream',
        messages: [{
            value: JSON.stringify({ event: 'task-created', task, created_at: Date.now() })
        }],
    })
}

const publishTaskCompleted = (taskId, assignee) => {
    return producer.send({
        topic: 'tasks-stream',
        messages: [{
            value: JSON.stringify({ event: 'task-completed', taskId, assignee, created_at: Date.now() })
        }],
    })
}

const publishTaskAssigned = (taskId, assignee) => {
    return producer.send({
        topic: 'tasks-stream',
        messages: [{
            value: JSON.stringify({ event: 'task-assigned', taskId, assignee, created_at: Date.now() })
        }],
    })
}

const publishTaskUnassigned = (taskId, assignee) => {
    return producer.send({
        topic: 'tasks-stream',
        messages: [{
            value: JSON.stringify({ event: 'task-unassigned', taskId, assignee, created_at: Date.now() })
        }],
    })
}

module.exports = {
    connect: producer.connect,
    disconnect: producer.disconnect,
    publishTaskCreated,
    publishTaskCompleted,
    publishTaskAssigned,
    publishTaskUnassigned,
};