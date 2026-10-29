import {writeFile} from 'node:fs/promises';
import {handPaths} from '../dist/hand-art.mjs';
for(const variant of ['two','three']){
 const paths=handPaths(variant,'#b9533d').map(([d,fill,width,stroke])=>'<path d="'+d+'" fill="'+(fill||'none')+'" stroke="'+(width?(stroke||'#29242b'):'none')+'" stroke-width="'+width+'"/>').join('');
 await writeFile('dist/assets/gun-'+variant+'.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="-76 -85 205 215"><g stroke-linejoin="round" stroke-linecap="round">'+paths+'</g></svg>\n');
}
