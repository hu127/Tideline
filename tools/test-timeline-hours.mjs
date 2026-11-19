import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const {code} = await transform(await readFile(new URL('../src/pages/timeline-hours.ts',import.meta.url),'utf8'),{loader:'ts',format:'esm'});
const {timelineHours,awakeMinutes} = await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
for (const [wake,sleep,duration] of [['06:00','24:00',1080],['07:30','23:30',960],['10:00','02:00',960]]) {
 const s=timelineHours(wake,sleep); assert.equal(s.awake,duration);
 let prev=-1;
 for(let m=0;m<=1440;m++){const t=`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;const x=s.position(t);assert.ok(x>=prev && x>=0 && x<=1);prev=x;}
 assert.ok(Math.abs(s.position('24:00')-1)<1e-10);
 let span=s.position(sleep)-s.position(wake);if(span<0)span+=1;
 assert.ok(Math.abs(span-.9)<1e-10);
 for(let i=1;i<s.ticks.length;i++) assert.ok(s.ticks[i].position>s.ticks[i-1].position);
}
assert.ok(timelineHours().position('01:00')>0);
assert.ok(timelineHours().position('01:00')<timelineHours().position('06:00'));
for(const x of ['25:00','24:01','12:60','abc','-1:00'])assert.equal(awakeMinutes(x),null);
assert.equal(timelineHours('bad','bad').awake,1080);
assert.equal(timelineHours('00:00','24:00').awake,1080);
console.log('PASS: awake and sleeping scale, midnight, monotonic positions, invalid settings, ticks');
