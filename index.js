import * as fs from 'fs';

const torrent = fs.readFileSync('visnu.torrent')
console.log(torrent);//buffer
console.log(torrent.toString('utf-8'))//bencode