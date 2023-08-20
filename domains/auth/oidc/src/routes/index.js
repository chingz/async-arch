const Router = require('koa-router');
const authRouter = require('../routes/auth.router.js');

const routes = (oidc) => {
  const router = new Router();
  router.use(authRouter(oidc).routes());

  return router;
};

module.exports = routes;