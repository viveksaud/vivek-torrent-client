import { Socket } from "net";
import { Buffer } from "buffer";
import * as tracker from "./tracker.js";
import * as message from "./message.js";
import Pieces from './Pieces.js'
import Queue from "./Queue.js";

export default (torrent) => {

  tracker.getPeers(torrent, (peers) => {
    //passing torrent now
    const pieces = new Pieces (torrent);
    peers.forEach((peer) => download(peer, torrent, pieces));
  });
};


function download(peer, torrent, pieces) {
  const socket = new Socket();
  socket.on("error", console.log);
  socket.connect(peer.port, peer.ip, () => {
    
    socket.write(message.buildHandshake(torrent));
    //using new Queue class
    const queue = new Queue(torrent);
    onWholeMsg(socket, (msg) => msgHandler(msg, socket, pieces, queue));
  });


  // socket.on("data", (data) => {
  //   // handle response
  // });
}

// .
function msgHandler(msg, socket, pieces, queue) {
  if (isHandshake(msg)) socket.write(message.buildInterested());
  else {
    const m = message.parse(msg);

    if (m.id === 0) chokeHandler(socket);
    //.
    if (m.id === 1) unchokeHandler(socket, pieces, queue);
    if (m.id === 4) haveHandler(m.payload);
    if (m.id === 5) bitfieldHandler(m.payload);
    if (m.id === 7) pieceHandler(m.payload, socket, pieces, queue);
  }
}


function isHandshake(msg) {
  return (
    msg.length === msg.readUInt8(0) + 49 &&
    msg.toString("utf8", 1) === "BitTorrent protocol"
  );
}

function onWholeMsg(socket, callback) {
  let savedBuf = Buffer.alloc(0);
  let handshake = true;

  socket.on("data", (recvBuf) => {
    // msgLen calculates the length of a whole message
    const msgLen = () =>
      handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
    savedBuf = Buffer.concat([savedBuf, recvBuf]);

    while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
      callback(savedBuf.slice(0, msgLen()));
      savedBuf = savedBuf.slice(msgLen());
      handshake = false;
    }
  });
}

const chokeHandler = (socket) => { socket.end()};
//.
const unchokeHandler = (socket,pieces, queue) => {
  queue.choked = false;
  //..
  requestPiece(socket, pieces, queue);
};

const haveHandler = (payload, socket, pieces, queue) => {
  const pieceIndex = payload.readUInt32BE(0);
  const queueEmpty = queue.length === 0;
  queue.queue(pieceIndex);
  if (queueEmpty) requestPiece(socket, pieces, queue);
}


const bitfieldHandler = (socket, pieces, queue, payload) => {
  const queueEmpty = queue.length === 0;
  payload.forEach((byte, i) => {
    for (let j = 0; j < 8; j++) {
      if (byte % 2) queue.queue(i * 8 + 7 - j);
      byte = Math.floor(byte / 2);
    }
  });
  if (queueEmpty) requestPiece(socket, pieces, queue);
}

const pieceHandler = (payload, socket, pieces, queue) => {
  // ...
  queue.shift();
  requestPiece(socket, pieces, queue);
};
//.
function requestPiece(socket, pieces, queue) {
  //..
  if (queue.choked) return null;

  while (queue.length()) {
    const pieceBlock = queue.deque();
    if (pieces.needed(pieceBlock)) {
      socket.write(message.buildRequest(pieceBlock));
      pieces.addRequested(pieceBlock);
      break;
    }
  }
}