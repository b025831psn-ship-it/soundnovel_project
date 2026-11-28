import assert from 'node:assert/strict';
import { appendHangul, koreanKeyboardGroups, NameEditor } from '../names.js';

assert.equal(appendHangul(appendHangul('', 'ㄱ'), 'ㅏ'), '가');
const editor = new NameEditor(koreanKeyboardGroups, '토오루');
editor.value = '';
editor.add('ㅁ'); editor.add('ㅏ'); editor.add('ㄹ'); editor.add('ㅣ');
assert.equal(editor.value, '마리');
console.log('Korean name keyboard composition OK');
