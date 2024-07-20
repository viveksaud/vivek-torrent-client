import { Socket } from "net";
import { Buffer } from "buffer";
import { getPeers } from "./tracker";

export default (torrent) => {
  getPeers(torrent, (peers) => {
    peers.forEach(download);
  });
};

function download(peer) {
  const socket = Socket();
  socket.on("error", console.log);
  socket.connect(peer.port, peer.ip, () => {
    // socket.write( xyz message ) 
  });
  socket.on("data", (data) => {
    // handle response 
  });
}
