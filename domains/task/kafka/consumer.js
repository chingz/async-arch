const { Kafka } = require('kafkajs');
const User = require('../mongodb/user.js');

const SchemaRegistry = require('../../../schemaRegistry');

const kafka = new Kafka({
    clientId: 'task-service',
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

module.exports = async () => {
    const usersStreamConsumer = kafka.consumer({ groupId: 'tasks-users-stream-reader', allowAutoTopicCreation: true });
    await usersStreamConsumer.subscribe({ topic: 'users-stream' });
    await usersStreamConsumer.run({ eachMessage: onUserEventHandler });
};