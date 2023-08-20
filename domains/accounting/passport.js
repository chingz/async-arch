const passport = require('koa-passport');
const fetch = require('node-fetch');

const { Issuer, Strategy } = require('openid-client');

const verify = (tokenSet, userInfo, done) => {
    console.log('OIDC verify', { tokenSet, userInfo });
    return done(null, userInfo);
};

module.exports = async (app) => {
    const issuer = await Issuer.discover(process.env.PUBLIC_OIDC_ISSUER);

    const client = new issuer.Client({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uris: ['http://localhost:8030/auth/oidc/callback'],
    });

    const strategy = new Strategy({
        client,
        params: {
            scope: 'openid profile email',
            prompt: 'login',
        },
    }, verify);

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user, done) => done(null, user));

    passport.use('oidc', strategy);

    app.use(passport.initialize());
    app.use(passport.session());
}