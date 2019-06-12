import { server as WebSocketServer, connection } from 'websocket'
import { createServer } from 'http'
import webpack from 'webpack'
import middleware from 'webpack-dev-middleware'
import connect from 'connect'
import getPort from 'get-port'
import { createInterface } from 'readline'
import yargs from 'yargs'
import config from '../webpack.config'
import address from 'address'

const { argv } = yargs
  .option('port', { alias: 'p', default: null as number | null, number: true })
  .option('host', { default: '127.0.0.1' })
  .option('title', { default: 'Progress' })

type ObjectCallback = (_: unknown) => void

const objects: unknown[] = []
const objectCallbacks: Array<ObjectCallback> = []
function onObjectAdded(callback: ObjectCallback): () => void {
  objectCallbacks.push(callback)
  return () => {
    const i = objectCallbacks.indexOf(callback)
    if (i !== -1) {
      objectCallbacks.splice(i, 1)
    }
  }
}
function addObject(object: unknown) {
  objects.push(object)
  for (const callback of objectCallbacks) {
    callback(object)
  }
}

function log(s: string) {
  console.log(`${new Date()}: ${s}`)
}

function sendJSON(connection: connection, object: unknown) {
  connection.sendUTF(JSON.stringify(object))
}

const compiler = webpack(config)

const app = connect()
app.use(middleware(compiler))

const server = createServer(app)

const portPromise =
  argv.port == null ? getPort({ port: getPort.makeRange(9000, 11000) }) : Promise.resolve(argv.port)
portPromise.then((port) => {
  server.listen(port, argv.host, () => {
    let addressToShow: string
    if (argv.host === '127.0.0.1' || argv.host === 'localhost') {
      addressToShow = 'localhost'
    } else if (argv.host === '0.0.0.0') {
      addressToShow = address.ip()
    } else {
      addressToShow = argv.host
    }
    log(`Listening on http://${addressToShow}:${port}/`)
  })

  const ws = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
  })

  ws.on('request', (request) => {
    const connection = request.accept(request.requestedProtocols[0], request.origin)
    log('Connection accepted')

    sendJSON(connection, { title: argv.title })
    sendJSON(connection, objects)

    const unsubscribe = onObjectAdded((object) => {
      sendJSON(connection, [object])
    })

    connection.on('close', () => {
      unsubscribe()
      log(`Peer ${connection.remoteAddress} disconnected`)
    })
  })
})

const rl = createInterface({ input: process.stdin })
rl.on('line', (line) => {
  try {
    addObject(JSON.parse(line))
  } catch (e) {
    if (e instanceof SyntaxError) {
      log(`JSON syntax error: ${e}`)
    } else {
      throw e
    }
  }
})
