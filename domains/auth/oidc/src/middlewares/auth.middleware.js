const onlyClient =
  (oidc) => async (ctx, next) => {
    const clientCredentials = await oidc.ClientCredentials.find(
      ctx.request.headers.authorization?.replace(/^Bearer /, "") ?? ""
    );
    if (clientCredentials) {
      await next();
    } else {
      ctx.status = 401;
      ctx.message = "UNAUTHORIZED";
      return;
    }
  };

module.exports = { onlyClient };