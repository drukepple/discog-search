import http from 'http';
import { ParsedUrlQuery } from 'querystring';
import {connection, server as wss} from 'websocket';
const WSS_PORT = 8008;

const server = http.createServer();
// server.listen(WSS_PORT);

const wsServer = new wss({
  httpServer: server,
});


const clients:Record<string, connection> = {};
// let connection;

export const getUniqueId = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16);
  return s4() + s4() + '-' + s4();
};

wsServer.on('request', request => {
  // var userId = getUniqueId();
  const query = request?.resourceURL.query as ParsedUrlQuery || {};
  console.log(request?.resourceURL.query);
  const userId = query.connectionId as string;
  // console.log('request', Object.keys(request.httpRequest.url));//.socket.resource.search());
  // console.log('request', request.resourceURL.query);//.socket.resource.search());
  // console.log('request', request.resourceURL.query.connectionId);//.socket.resource.search());
  console.log(`${new Date()} Received a new connection from origin ${request.origin}.`)
  // This allows all origins; change null if needed
  const connection = request.accept('market-load', request.origin);
  clients[userId] = connection;
  console.log(`Connected: ${userId} in ${Object.getOwnPropertyNames(clients)}`);

  connection.on('message', message => {
    console.log('MESSAGE:', message);
  })

  connection.sendUTF(JSON.stringify({
    message: 'socket-init',
    id: userId,
  }))
});


export function sendProgressUpdate(page: number, totalPages: number, connectionId: string) {
  const connection = clients[connectionId];
  console.log('send prog update on', connectionId)
  if (!connection) { return; console.log('No socket connection');}
  console.log("Found connection", connectionId, connection);
  connection.sendUTF(JSON.stringify({
    message: 'progress-update',
    page,
    totalPages,
    progress: page/totalPages,
  }));
}
