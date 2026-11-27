import test from "node:test";
import assert from "node:assert/strict";
import { Boot } from "../src/boot.js";
import { MemoryBackend } from "../../../shared/save/backends.js";
import { openBooks } from "../src/books-store.js";

async function fake(inGame) {
  const books = await openBooks({ backend: new MemoryBackend(), storage: { getItem: () => null } });
  const boot = Object.create(Boot.prototype);
  Object.assign(boot, {
    books, vm: { ram: { inGame, node: 0 } }, screen: { tone: { a: 1 } }, pageStart: { bank: 19, offset: 5 },
    nodeTitle: () => [], continueRequest: null, titleActive: false, names: {},
  });
  return boot;
}

test("the page is kept in the suspend slot only while in the game", async () => {
  const welcome = await fake(0);
  welcome.suspend();
  assert.equal(welcome.canContinue(), false);
  const game = await fake(1);
  game.suspend();
  assert.equal(game.canContinue(), true);
  assert.equal(game.books.any(), false); // the bookshelf never sees it
  assert.deepEqual(game.books.suspend.read().state, { bank: 19, offset: 5 });
});

test("continue is taken only at the title, once", async () => {
  const boot = await fake(1);
  boot.suspend();
  assert.equal(boot.continueSuspended(), false); // not at the title
  boot.titleActive = true;
  assert.equal(boot.continueSuspended(), true);
  assert.equal(boot.continueSuspended(), false); // already requested
  assert.deepEqual(boot.continueRequest.state, { bank: 19, offset: 5 });
});

test("nothing to continue from an empty slot", async () => {
  const boot = await fake(1);
  boot.titleActive = true;
  assert.equal(boot.continueSuspended(), false);
});
