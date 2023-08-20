const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['OPEN', 'CLOSED'],
        default: 'OPEN',
    },
    assignee: {
        type: String,
        required: true,
    },
});

TaskSchema.statics.forUser = (assignee) => Task.find({ assignee, status: 'OPEN' }).exec();
TaskSchema.statics.complete = (user, id) => Task.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(id), assignee: user.username }, { status: 'CLOSED' }, { new: true });

TaskSchema.statics.reassign = async (workers, fireAssign, fireUnassign) => {
    const openTasks = await Task.find({ status: 'OPEN' }).exec();
    for (let task of openTasks) {
        const oldWorker = task.assignee;
        const newWorker = workers[[Math.floor(Math.random() * workers.length)]];
        await Task.findOneAndUpdate({ _id: task._id }, { assignee: newWorker.username });
        await fireUnassign(task._id, oldWorker);
        await fireAssign(task._id, newWorker.username);
    }
}

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;