const uuid = require('uuid');
const { Kafka } = require('kafkajs');
const SchemaRegistry = require('../../../schemaRegistry');

const User = require('../mongodb/user.js');
const TaskAudit = require('../mongodb/task_audit.js');

const kafka = new Kafka({
    clientId: 'accounting-service',
    logLevel: process.env.BROKER_LOG_LEVEL,
    brokers: [process.env.BROKER],
});

const onUserEventHandler = async ({ message }) => {
    const event = JSON.parse(message.value);
    const schemaValidationResult = SchemaRegistry.validate(event);
    if (schemaValidationResult.valid) {
        console.log('users-stream event', event);
        switch (event.eventName) {
            case 'user-deleted':
                await User.deleteOne({ username: event.data.username });
                break;
            case 'user-created':
                await User.create(event.data);
                break;
            case 'user-updated':
                await User.findOneAndUpdate({ username: event.data.username }, event.data);
                break;
            default:
                console.warn('Uknown users-stream message: ', event);
        }
    }
}

const onTaskEventHandler = async ({ message }) => {
    const event = JSON.parse(message.value);
    const schemaValidationResult = SchemaRegistry.validate(event);
    if (schemaValidationResult.valid) {
        console.log('tasks event', event);
        switch (event.eventName) {
            case 'task-assigned':
                await TaskAudit.taskAssignedTo(event.data.taskId, event.data.assignee);
                break;
            case 'task-completed':
                await TaskAudit.taskCompletedBy(event.data.taskId, event.data.assignee);
                break;
            default:
                console.warn('Uknown tasks message: ', event);
        }
    }
}

module.exports = async () => {
    const usersStreamConsumer = kafka.consumer({ groupId: 'accounting-users-stream-reader', allowAutoTopicCreation: true });
    await usersStreamConsumer.subscribe({ topic: 'users-stream' });
    await usersStreamConsumer.run({ eachMessage: onUserEventHandler });

    const tasksStreamConsumer = kafka.consumer({ groupId: 'accounting-tasks-stream-reader', allowAutoTopicCreation: true });
    await tasksStreamConsumer.subscribe({ topic: 'tasks' });
    await tasksStreamConsumer.run({ eachMessage: onTaskEventHandler });
};