import { getItemContentFingerprint } from './contentFingerprint.js';

// Digest-derived geometry: every meaningful edit changes the whole composition.
export function getInventoryObjectShape(item = {}) {
  const digest = getItemContentFingerprint(item);
  let seed = parseInt(digest.slice(0, 8), 16);
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
  const sides = 4 + Math.floor(random() * 6);
  const width = 24 + random() * 10, height = 25 + random() * 9;
  const angle = random() * Math.PI * 2;
  const fluted = random() > .5;
  const front = Array.from({ length: sides }, (_, index) => {
    const theta = angle + index * Math.PI * 2 / sides;
    const radius = fluted && index % 2 ? .66 + random() * .15 : 1;
    return [56 + Math.cos(theta) * width * radius, 60 + Math.sin(theta) * height * radius];
  });
  const dx = 7 + random() * 9, dy = -8 - random() * 9;
  const back = front.map(([x,y]) => [x+dx,y+dy]);
  const hub = [52 + random()*10, 53 + random()*12];
  const points = vertices => vertices.map(pair => pair.map(value => value.toFixed(2)).join(',')).join(' ');
  const faces = front.flatMap((point,index) => {
    const next=(index+1)%sides;
    return (front[next][0]-point[0])*dy-(front[next][1]-point[1])*dx > 0
      ? [{points:points([point,back[index],back[next],front[next]]),shade:'side',opacity:.5+random()*.3}]:[];
  });
  // Solid silhouette beneath triangular facets; all fills stay in the box palette.
  faces.push({points:points(front),shade:'front',opacity:.95});
  front.forEach((point,index) => faces.push({points:points([hub,point,front[(index+1)%sides]]),shade:index%3===0?'side':'top',opacity:.22+random()*.5}));
  if (random() > .35) {
    const inset = front.map(([x,y]) => [hub[0]+(x-hub[0])*.42,hub[1]+(y-hub[1])*.42]);
    faces.push({points:points(inset),shade:'front',opacity:.3+random()*.4});
  }
  return faces;
}
