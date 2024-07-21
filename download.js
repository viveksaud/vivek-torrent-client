import { Socket } from "net";
import { Buffer } from "buffer";
import { getPeers } from "./tracker.js";
import * as message from "./message.js";

export default (torrent) => {
  getPeers(torrent, (peers) => {
    //1
    peers.forEach((peer) => download(peer, torrent));
  });
};

function download(peer) {
  const socket = Socket();
  socket.on("error", console.log);
  socket.connect(peer.port, peer.ip, () => {
    // socket.write( xyz message )
    // 1
    socket.write(message.buildHandshake(torrent));
    // 2
    onWholeMsg(socket, (msg) => msgHandler(msg, socket));
  });
  socket.on("data", (data) => {
    // handle response
  });
}

// 2
function msgHandler(msg, socket) {
  if (isHandshake(msg)) socket.write(message.buildInterested());
}

// 3
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

export const parse = (msg) => {
  const id = msg.length > 4 ? msg.readInt8(4) : null;
  let payload = msg.length > 5 ? msg.slice(5) : null;
  if (id === 6 || id === 7 || id === 8) {
    const rest = payload.slice(8);
    payload = {
      index: payload.readInt32BE(0),
      begin: payload.readInt32BE(4),
    };
    payload[id === 7 ? "block" : "length"] = rest;
  }

  return {
    size: msg.readInt32BE(0),
    id: id,
    payload: payload,
  };
};
