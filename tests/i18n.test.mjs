import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {messages,resolveLanguage,setLanguage,t} from '../dist/i18n.mjs';
test('default language follows the first browser preference with English fallback',()=>{
  for(const tag of ['zh-CN','zh-HK','zh-TW','zh-Hant','zh'])assert.equal(resolveLanguage([tag]),'zh');
  for(const tags of [[],['en-US'],['en-GB','zh-CN'],['ja-JP']])assert.equal(resolveLanguage(tags),'en');
});
test('both locales cover the same UI and camera keys, and interpolate charge text',async()=>{
  assert.deepEqual(Object.keys(messages.zh).sort(),Object.keys(messages.en).sort());
  const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  for(const match of html.matchAll(/data-i18n(?:-aria-label|-alt|-title)?="([^"]+)"/g))assert.ok(messages.en[match[1]],match[1]);
  for(const lang of ['en','zh']){setLanguage(lang);assert.ok(t('chargeLabel',{side:'L',damage:3}).includes('3'));assert.ok(t('comboFeedback',{count:5}).includes('5'));}
});
test('teaching UI has one gun pose and live rendering never selects a middle-finger variant',async()=>{
  const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  assert.equal(html.includes('gun-three.svg'),false);
  const renderer=await readFile(new URL('../dist/renderer.mjs',import.meta.url),'utf8');assert.equal(renderer.includes('pose?.variant'),false);
});
