import Koa from 'koa'
import Router from 'koa-router'
import session from 'koa-session'
// import morgan from 'koa-morgan'
// import bodyParser from 'koa-bodyparser'
import { sessionConfig } from './config'
import { requestToken, getToken, verifyCredentials, queryTimeline } from './controllers/oauth'
import authorize from './middlewares/authorize'

const app = new Koa()

app.keys = ['twitter', 'SetrlhpTdCE5WjJhdm']
app.use(session(sessionConfig, app))

const router = new Router()
router.get('/twitter/request/token', requestToken)
router.get('/twitter/token', getToken)
router.get('/twitter/credentials', authorize, verifyCredentials)
router.get('/twitter/timeline', authorize, queryTimeline)
app.use(router.routes()).use(router.allowedMethods())

const port = process.env.PORT || '3000'
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`)
  process.send && process.send('ready')
})
