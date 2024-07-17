import * as fs from 'fs';
import bencode from 'bencode'

const torrent = fs.readFileSync('visnu.torrent')

const torrentDecoded = bencode.decode(torrent)
console.log(torrentDecoded);//object//decoded-bencode containing values in buffer (not in string), which is like a json format //traditionally in nodejs, binary data were handled by buffer but now browsers and modern javascript uses typed array like unit8array for efficiently handling binary data.
console.log(torrentDecoded.announce)//buffer//typed array(i.e.Unit8Array) //announce = url of tracker

