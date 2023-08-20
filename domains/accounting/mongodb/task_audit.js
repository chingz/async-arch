const mongoose = require('mongoose');

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const TaskAuditSchema = new mongoose.Schema({
    user: String,
    taskId: String,
    balanceChange: Number,
    action: String,
    created_at: Date,
});

TaskAuditSchema.statics.getByUsername = (user) => TaskAudit.find({ user }).exec();

TaskAuditSchema.statics.taskAssignedTo = async (taskId, assignee) => {
    const audit = TaskAudit.create({
        user: assignee,
        taskId: taskId,
        balanceChange: getRandomInt(-20, -10),
        action: 'task-assigned',
        created_at: Date.now(),
    });
}

TaskAuditSchema.statics.taskCompletedBy = async (taskId, assignee) => {
    const audit = TaskAudit.create({
        user: assignee,
        taskId: taskId,
        balanceChange: getRandomInt(20, 40),
        action: 'task-completed',
        created_at: Date.now(),
    });
}

TaskAuditSchema.statics.getPreviousDayLogs = () => {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return TaskAudit.find({ created_at: { $gte: yesterday, $lt: today } });
}

const TaskAudit = mongoose.model('TaskAudit', TaskAuditSchema);

module.exports = TaskAudit;