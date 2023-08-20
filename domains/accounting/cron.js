const cron = require('node-cron');
const TaskAudit = require('./mongodb/task_audit.js');
const User = require('./mongodb/user.js');
const Statistics = require('./mongodb/statistics.js');
const { sendUserEmail } = require('./email.js');

cron.schedule('1 0 * * *', async () => {
    const usersBalance = {};
    for await (const log of TaskAudit.getPreviousDayLogs()) {
        if (!usersBalance[log.user]) {
            usersBalance[log.user] = 0;
        }

        usersBalance[log.user] += log.balanceChange;
    }

    await User.payroll(usersBalance, sendUserEmail);
}, { name: 'update-users-balance', scheduled: true });

cron.schedule('1 0 * * *', async () => {
    let mostExpensiveTask = 0;
    for await (const log of TaskAudit.getPreviousDayLogs()) {
        if (log.balanceChange > mostExpensiveTask) {
            mostExpensiveTask = log.balanceChange;
        }
    }

    await Statistics.create({ name: 'the_most_expensive_task', value: mostExpensiveTask });
}, { name: 'the-most-exspensive-task', scheduled: true });

cron.schedule('1 0 * * *', async () => {
    let value = 0;
    for await (const log of TaskAudit.getPreviousDayLogs()) {
        value += log.balanceChange;
    }

    await Statistics.create({ name: 'total_income', value: value * -1 });
}, { name: 'total-income', scheduled: true });