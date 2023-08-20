const Koa = require('koa');
const { koaBody } = require("koa-body");
const render = require("koa-ejs");
const passport = require('koa-passport');
const Router = require('koa-router');
const session = require('koa-generic-session');
const redisStore = require('koa-redis');
const path = require('path');
const configurePassport = require('./passport.js');
const kafkaConsumer = require('./kafka/consumer.js');
const kafkaProducer = require('./kafka/producer.js');
const mongodb = require('./mongodb');
const Task = require('./mongodb/task.js');
const User = require('./mongodb/user.js');

(async () => {
    const router = new Router();
    const app = new Koa();
    const bodyParser = koaBody({
        multipart: true,
        urlencoded: true,
    });

    app.use(session({
        store: redisStore({ host: 'cache' })
    }));

    await mongodb();
    await kafkaConsumer();
    await kafkaProducer.connect();
    await configurePassport(app);

    render(app, {
        cache: false,
        viewExt: "ejs",
        layout: false,
        root: path.resolve("./views"),
    });

    app.keys = ['subzero', 'scorpio'];

    router.get('/login', passport.authenticate('oidc'));

    router.get('/logout', (ctx) => {
        ctx.logout();
        ctx.redirect('/login');
    });

    const ensureAuthenticated = (...roles) => (ctx, next) => {
        if (ctx.isAuthenticated() && (roles.length === 0 || roles.includes(ctx.state.user.role))) {
            return next();
        } else {
            return ctx.redirect('/login');
        }
    }

    router.get('/', ensureAuthenticated(), async (ctx) => {
        const tasks = await Task.forUser(ctx.state.user.username);
        return ctx.render('user-tasks', { tasks })
    })

    router.get('/create', ensureAuthenticated(), async (ctx) => {
        const workers = await User.getWorkers();
        return ctx.render('create-task', { workers });
    })

    router.post('/create', ensureAuthenticated(), bodyParser, async (ctx) => {
        const task = await Task.create(ctx.request.body);
        await kafkaProducer.publishTaskAssigned(task._id, task.assignee);
        ctx.redirect('/');
    })

    router.post('/complete', ensureAuthenticated(), bodyParser, async (ctx) => {
        const task = await Task.complete(ctx.state.user, ctx.request.body._id);
        await kafkaProducer.publishTaskCompleted(task._id, task.assignee);
        return ctx.redirect('/');
    })

    router.post('/assign', ensureAuthenticated('admin', 'manager'), bodyParser, async (ctx) => {
        const workers = await User.getWorkers();
        console.log('reassign tasks between', workers)
        await Task.reassign(workers, kafkaProducer.publishTaskAssigned);
        return ctx.redirect('/');
    })

    router.get('/auth/oidc/callback', passport.authenticate('oidc', { successRedirect: '/', failureRedirect: '/login' }));

    app.use(router.routes());

    app.listen(process.env.PORT, () => console.log(`task_service - listening on port ${process.env.PORT}`));
})();

