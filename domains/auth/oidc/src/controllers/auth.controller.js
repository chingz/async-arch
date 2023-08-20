const Account = require('../db/mongodb/models/account.js');
const kafka = require('../kafka/producer.js');

function debug(obj) {
  return Object.entries(obj)
    .map(
      (ent) => `<strong>${ent[0]}</strong>: ${JSON.stringify(ent[1])}`
    )
    .join("<br>");
}

const routes = (oidc) => ({
  login: async (ctx) => {
    const {
      prompt: { name },
    } = await oidc.interactionDetails(ctx.req, ctx.res);
    if (name === "login") {
      const account = await Account.findByLogin(ctx.request.body.username);
      let result;
      if (account?.password === ctx.request.body.password) {
        result = {
          login: {
            accountId: ctx.request.body.username,
          },
        };
      } else {
        result = {
          error: "access_denied",
          error_description: "Username or password is incorrect.",
        };
      }
      return oidc.interactionFinished(ctx.req, ctx.res, result, {
        mergeWithLastSubmission: false,
      });
    }
  },
  addUser: async (ctx) => {
    const body = ctx.request.body;
    const user = await Account.create({
      username: body.username,
      password: body.password,
      email: body.email,
      role: body.role,
    });

    await kafka.publishUserCreatedOrUpdated('user-created', user.asDomainModel());
    ctx.message = "User successfully created.";
  },
  deleteUser: async (ctx) => {
    const user = await Account.findByLogin(ctx.params.uid);
    if (!user) ctx.throw(404);

    await Account.deleteOne({ _id: user._id });
    await kafka.publishUserDeleted(user.asDomainModel());

    ctx.message = "User successfully deleted.";
  },
  updateUser: async (ctx) => {
    const user = await Account.findByLogin(ctx.params.uid);
    if (!user) ctx.throw(404);

    const updatedUser = await Account.findOneAndUpdate({ _id: user._id }, ctx.request.body, { new: true });
    await kafka.publishUserCreatedOrUpdated('user-updated', updatedUser.asDomainModel());

    ctx.message = "User successfully updated.";
  },
  confirmInteraction: async (ctx) => {
    const interactionDetails = await oidc.interactionDetails(ctx.req, ctx.res);

    const {
      prompt: { name, details },
      params,
      session: { accountId },
    } = interactionDetails;

    if (name === "consent") {
      const grant = interactionDetails.grantId
        ? await oidc.Grant.find(interactionDetails.grantId)
        : new oidc.Grant({
          accountId,
          clientId: params.client_id,
        });

      if (grant) {
        if (details.missingOIDCScope) {
          grant.addOIDCScope(details.missingOIDCScope.join(" "));
        }
        if (details.missingOIDCClaims) {
          grant.addOIDCClaims(details.missingOIDCClaims);
        }
        if (details.missingResourceScopes) {
          for (const [indicator, scopes] of Object.entries(
            details.missingResourceScopes
          )) {
            grant.addResourceScope(indicator, scopes.join(" "));
          }
        }

        const grantId = await grant.save();

        const result = { consent: { grantId } };
        await oidc.interactionFinished(ctx.req, ctx.res, result, {
          mergeWithLastSubmission: true,
        });
      }
    } else {
      ctx.throw(400, "Interaction prompt type must be `consent`.");
    }
  },
  abortInteraction: async (ctx) => {
    const result = {
      error: "access_denied",
      error_description: "End-User aborted interaction",
    };
    await oidc.interactionFinished(ctx.req, ctx.res, result, {
      mergeWithLastSubmission: false,
    });
  },
  interaction: async (ctx) => {
    const details = await oidc.interactionDetails(ctx.req, ctx.res);

    const {
      uid, prompt, params, session,
    } = details;

    switch (prompt.name) {
      case 'login': {
        return ctx.render('login', {
          uid,
          details: prompt.details,
          params,
          title: 'Sign-in',
          google: ctx.google,
          session: session ? debug(session) : undefined,
          dbg: {
            params: debug(params),
            prompt: debug(prompt),
          },
        });
      }
      case 'consent': {
        return ctx.render('consent', {
          uid,
          clientId: params.client_id,
          params,
          title: 'Authorize',
          scope: params.scope.replace(/ /g, ", "),
          session: session ? debug(session) : undefined,
          dbg: {
            params: debug(params),
            prompt: debug(prompt),
          },
        });
      }
      default:
        return next();
    }
  },
});

module.exports = routes;