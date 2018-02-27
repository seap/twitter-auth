import { OAuth } from 'oauth'
import { consumerKey, consumerSecret } from '../config'
import codeMessage from '../codeMessage'
const callbackUrl = 'http://seayang.me/twitter/token'

const oAuth = new OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  consumerKey,
  consumerSecret,
  '1.0',
  callbackUrl,
  'HMAC-SHA1'
)

function requestAccessToken() {
  return new Promise((resolve, reject) => {
    oAuth.getOAuthRequestToken((error, oAuthToken, oAuthTokenSecret, results) => {
      if (error) {
        reject(error)
      } else {
        resolve({
          oAuthToken,
          oAuthTokenSecret
        })
      }
    })
  })
}

function getAccessToken(oAuthToken, oAuthTokenSecret, oAuthVerifier) {
  return new Promise((resolve, reject) => {
    oAuth.getOAuthAccessToken(
      oAuthToken,
      oAuthTokenSecret,
      oAuthVerifier,
      (error, oAuthAccessToken, oAuthAccessTokenSecret, results) => {
        if (error) {
          reject(error)
        } else {
          resolve({
            oAuthAccessToken,
            oAuthAccessTokenSecret
          })
        }
      }
    )
  })
}

function oAuthGet(url, oAuthAccessToken, oAuthAccessTokenSecret) {
  return new Promise((resolve, reject) => {
    oAuth.get(url, oAuthAccessToken, oAuthAccessTokenSecret, (error, responseData, result) => {
      if (error) {
        return reject(error)
      }
      try {
        return resolve(JSON.parse(responseData))
      } catch (parseError) {
        return reject(parseError)
      }
    })
  })
}

export async function requestToken(ctx, next) {
  try {
    const { oAuthToken, oAuthTokenSecret } = await requestAccessToken()
    ctx.session.oAuthToken = oAuthToken
    ctx.session.oAuthTokenSecret = oAuthTokenSecret
    ctx.body = oAuthToken
  } catch (error) {
    console.log(error)
    return (ctx.body = codeMessage.exception)
  }
}

export async function getToken(ctx, next) {
  if (!ctx.session || !ctx.session.oAuthToken || !ctx.session.oAuthTokenSecret) {
    return (ctx.body = 'error, session')
  }
  try {
    const { oauth_token: oAuthToken, oauth_verifier: oAuthVerifier } = ctx.query
    if (oAuthToken !== ctx.session.oAuthToken) {
      return (ctx.body = 'error, oAuthToken is not different')
    }
    const { oAuthAccessToken, oAuthAccessTokenSecret } = await getAccessToken(
      oAuthToken,
      ctx.session.oAuthTokenSecret,
      oAuthVerifier
    )
    ctx.session.oAuthAccessToken = oAuthAccessToken
    ctx.session.oAuthAccessTokenSecret = oAuthAccessTokenSecret
    ctx.body = ctx.session //"success";
  } catch (error) {
    console.log(error)
    return (ctx.body = codeMessage.exception)
  }
}

export async function verifyCredentials(ctx, next) {
  const { oAuthAccessToken, oAuthAccessTokenSecret } = ctx.session
  try {
    const data = await oAuthGet(
      'https://api.twitter.com/1.1/account/verify_credentials.json',
      oAuthAccessToken,
      oAuthAccessTokenSecret
    )
    return (ctx.body = { ...codeMessage.success, data })
  } catch (error) {
    console.log(error)
    return (ctx.body = codeMessage.exception)
  }
}

export async function queryTimeline(ctx, next) {
  const { oAuthAccessToken, oAuthAccessTokenSecret } = ctx.session
  try {
    const data = await oAuthGet(
      'https://api.twitter.com/1.1/statuses/home_timeline.json?count=30',
      oAuthAccessToken,
      oAuthAccessTokenSecret
    )
    return (ctx.body = { ...codeMessage.success, data })
  } catch (error) {
    console.log(error)
    return (ctx.body = codeMessage.exception)
  }
}
