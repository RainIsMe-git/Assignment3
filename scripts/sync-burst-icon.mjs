import {writeFile} from 'node:fs/promises';
import {handPaths,FINGERTIP} from '../dist/hand-art.mjs';
import {HAND_COLORS} from '../dist/hand-identity.mjs';
const glove=(side)=>{const paths=handPaths('two',HAND_COLORS[side]).map(([d,fill,width,stroke])=>`<path d="${d}" fill="${fill||'none'}" stroke="${width?(stroke||'#29242b'):'none'}" stroke-width="${width}"/>`).join('');return `<g transform="translate(${side==='left'?0:FINGERTIP*2} 0) scale(${side==='left'?1:-1} 1)">${paths}</g>`;};
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-72 -85 368 215"><g stroke-linejoin="round" stroke-linecap="round">${glove('left')}${glove('right')}<g transform="translate(${FINGERTIP} 0)"><circle r="30" fill="#c594e8" opacity=".25"/><path d="M0 -31 L8 -12 L24 -22 L15 -4 L34 3 L13 11 L19 29 L2 18 L-10 34 L-12 13 L-31 19 L-20 2 L-34 -9 L-13 -10 L-18 -29 L-3 -17Z" fill="#fff2b9" stroke="#9b6eb6" stroke-width="3"/><circle r="7" fill="#fffdf0"/></g></g></svg>\n`;
await writeFile(new URL('../dist/assets/burst.svg',import.meta.url),svg);
