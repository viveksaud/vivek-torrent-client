import { createSocket } from "dgram";
import { Buffer } from "buffer";
import { URL } from "url";
import crypto from "crypto";


export const getPeers = (torrent, callback) => {
  const socket = createSocket("udp4");
  const url = torrent.announce.toString("utf8");

  // 1. send connect request
  udpSend(socket, buildConnReq(), url);

  socket.on("message", (response) => {
    if (respType(response) === "connect") {
      // 2. receive and parse connect response
      const connResp = parseConnResp(response);
      // 3. send announce request
      const announceReq = buildAnnounceReq(connResp.connectionId);
      udpSend(socket, announceReq, url);
    } else if (respType(response) === "announce") {
      // 4. parse announce response
      const announceResp = parseAnnounceResp(response);
      // 5. pass peers to callback
      callback(announceResp.peers);
    }
  });
};

function udpSend(socket, message, rawUrl, callback = () => {}) {

  const url = new URL(rawUrl);
  socket.send(message, 0, message.length, url.port, url.host, callback);
}

function respType(resp) {
  // ...
}

const buildConnReq = () => {
  const buf = Buffer.allocUnsafe(16);

  // connection id = 0x41727101980 (fix value according to BEP description)
  buf.writeUInt32BE(0x417, 0); //big-endian(BE) format: most significant byte stored in lowest memory address
  buf.writeUInt32BE(0x27101980, 4); //write of fixed 64 bit magic number  0x41727101980 got splited into two times write of 32bit number with BE formt, since node doesn't support direct write of  64 bit integer or float

  // action
  buf.writeUInt32BE(0, 8); // value is always 0 for connection request and since above size is of 8bytes, so offest is 8

  // transaction id
  crypto.randomBytes(4).copy(buf, 12); //random 4 byte buffer

  return buf;
};

const parseConnResp = (resp) => {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    connectionId: resp.slice(8), //since node doesn't support reading of 64 bit integer, so we managed to get it by slicing at offset 8
  };
};

function buildAnnounceReq(connId) {
  // ...
}

function parseAnnounceResp(resp) {
  // ...
}
