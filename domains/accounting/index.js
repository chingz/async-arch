const Koa = require('koa');
const render = require("koa-ejs");
const passport = require('koa-passport');
const Router = require('koa-router');
const session = require('koa-generic-session');
const redisStore = require('koa-redis');
const path = require('path');
const configurePassport = require('./passport.js');
const kafkaConsumer = require('./kafka/consumer.js');
const mongodb = require('./mongodb');
const User = require('./mongodb/user.js');
const TaskAudit = require('./mongodb/task_audit.js');
const Statistics = require('./mongodb/statistics.js');

require('./cron.js');

(async () => {
    const router = new Router();
    const app = new Koa();

    app.use(session({
        store: redisStore({ host: 'cache' })
    }));

    await mongodb();
    await kafkaConsumer();
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
        return ['admin', 'manager'].includes(ctx.state.user.role) ? ctx.redirect('analytics') : ctx.redirect('my-balance');
    })

    router.get('/my-balance', ensureAuthenticated(), async (ctx) => {
        const user = await User.getByUsername(ctx.state.user.username);
        const logs = await TaskAudit.getByUsername(ctx.state.user.username);
        return ctx.render('my-balance', { user, logs });
    })

    router.get('/analytics', ensureAuthenticated('admin', 'manager'), async (ctx) => {
        const expensive_task_stats = await Statistics.find({ name: 'the_most_expensive_task' }).sort({ date: -1 }).exec();
        const total_income_stats = await Statistics.find({ name: 'total_income' }).sort({ date: -1 }).exec();
        return ctx.render('statistics', { expensive_task_stats, total_income_stats });
    })

    router.get('/auth/oidc/callback', passport.authenticate('oidc', { successRedirect: '/', failureRedirect: '/login' }));

    app.use(router.routes());

    app.listen(process.env.PORT, () => console.log(`audit_service - listening on port ${process.env.PORT}`));
})();

