const { Kafka } = require('kafkajs');
const User = require('../mongodb/user.js');

const kafka = new Kafka({
    clientId: 'task-service',
    logLevel: process.env.BROKER_LOG_LEVEL,
    brokers: [process.env.BROKER],
});

const onUserEventHandler = async ({ message }) => {
    const payload = JSON.parse(message.value);
    console.log('users-stream event', payload);
    switch (payload.event) {
        case 'user-deleted':
            await User.deleteOne({ username: payload.username });
            break;
        case 'user-created':
            await User.create(payload.user);
            break;
        case 'user-updated':
            await User.findOneAndUpdate({ username: payload.user.username }, payload.user);
            break;
        default:
            console.warn('Uknown users-stream message: ', payload);
    }
}

module.exports = async () => {
    const usersStreamConsumer = kafka.consumer({ groupId: 'tasks-users-stream-reader' });
    await usersStreamConsumer.subscribe({ topic: 'users-stream' });
    await usersStreamConsumer.run({ eachMessage: onUserEventHandler });
};