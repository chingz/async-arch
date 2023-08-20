const Koa = require("koa");
const render = require("koa-ejs");
const mount = require("koa-mount");
const koaStatic = require("koa-static");
const path = require("path");
const MongoDbAdapter = require("./db/mongodb/mongodb.js");
const { configuration } = require("./configs/configuration.js");
const Provider = require('oidc-provider');
const router = require("./routes/index.js");
const Account = require('./db/mongodb/models/account.js')
const kafka = require('./kafka/producer.js');

const start = async () => {
  await MongoDbAdapter.connect();
  await kafka.connect();

  const app = new Koa();
  render(app, {
    cache: false,
    viewExt: "ejs",
    layout: false,
    root: path.resolve(path.join(__dirname), "./views"),
  });

  const provider = new Provider(process.env.OIDC_ISSUER, { ...configuration, adapter: MongoDbAdapter, findAccount: Account.findAccount });

  app.use(koaStatic(path.resolve("public")));
  app.use(router(provider).routes());
  app.use(mount(provider.app));

  app.listen(process.env.PORT, () => {
    console.log(`oidc-provider listening on port ${process.env.PORT}`);
  });
};

void start();
