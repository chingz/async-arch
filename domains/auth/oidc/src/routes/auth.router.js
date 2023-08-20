const { koaBody } = require("koa-body");
const Router = require("koa-router");
const authController = require("../controllers/auth.controller.js");
const { noCache } = require("../middlewares/no-cache.middleware.js");

const bodyParser = koaBody();

const routes = (oidc) => {
  const router = new Router();

  const { abortInteraction, confirmInteraction, interaction, login, addUser, deleteUser, updateUser } =
    authController(oidc);

  router.post("/users", bodyParser, addUser);

  router.del("/users/:uid", noCache, deleteUser)
  router.put("/users/:uid", noCache, bodyParser, updateUser)

  router.post("/interaction/:uid/login", noCache, bodyParser, login);
  router.post("/interaction/:uid/confirm", noCache, confirmInteraction);
  router.get("/interaction/:uid/abort", noCache, abortInteraction);
  router.get("/interaction/:uid", noCache, interaction);

  return router;
};

module.exports = routes;