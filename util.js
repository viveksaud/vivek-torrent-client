import crypto from 'crypto'

let id = null;

export const genId = () => {
    if (!id) {
        id = crypto.randomBytes(20);
        Buffer.from('-VT0001-').copy(id,0);//VT-vivektorrent
    }
    return id;
}

export const group = (iterable, groupSize) => {
  let groups = [];
  for (let i = 0; i < iterable.length; i += groupSize) {
    groups.push(iterable.slice(i, i + groupSize));
  }
  return groups;
}