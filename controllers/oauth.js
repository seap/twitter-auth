import { OAuth } from 'oauth'
import { consumerKey, consumerSecret, callbackUrl } from '../config'
import codeMessage from '../codeMessage'

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

function oAuthPost(
  url,
  oAuthAccessToken,
  oAuthAccessTokenSecret,
  body,
  contentType = 'application/x-www-form-urlencoded'
) {
  return new Promise((resolve, reject) => {
    console.log('oAuthAccessToken: ', oAuthAccessToken)
    console.log('oAuthAccessTokenSecret: ', oAuthAccessTokenSecret)
    oAuth.post(url, oAuthAccessToken, oAuthAccessTokenSecret, body, contentType, (error, responseData, result) => {
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
    ctx.body = { ...codeMessage.success, data: oAuthToken }
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
    //success
    ctx.redirect('http://seayang.me:4000/twitter/twitters')
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

export async function postTweeting(ctx, next) {
  const { text } = ctx.request.body
  if (!text) {
    return (ctx.body = codeMessage.paramError)
  }
  const { oAuthAccessToken, oAuthAccessTokenSecret } = ctx.session
  try {
    const data = await oAuthPost(
      'https://api.twitter.com/1.1/statuses/update.json',
      oAuthAccessToken,
      oAuthAccessTokenSecret,
      {
        status: text
      }
    )
    return (ctx.body = { ...codeMessage.success, data })
  } catch (error) {
    console.log(error)
    return (ctx.body = codeMessage.exception)
  }
}
