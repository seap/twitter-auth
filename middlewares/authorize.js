import codeMessage from '../codeMessage'

export default async function(ctx, next) {
  const { oAuthAccessToken, oAuthAccessTokenSecret } = ctx.session
  if (!oAuthAccessToken || !oAuthAccessTokenSecret) {
    return (ctx.body = codeMessage.unauthorized)
  }
  // need more strict checking
  await next()
}
