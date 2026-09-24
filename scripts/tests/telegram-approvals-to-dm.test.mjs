// TELEGRAM-APPROVALS-TO-DM-0924 (NI-Brain Decision #2012, JB live 2026-09-24)
//
// JB was not reliably seeing approval cards posted to the NVG Agents group's
// Approvals topic. Every JB-facing Telegram path now targets his private
// chat with the bot by default, never the group+topic. These tests exercise
// the two live source files directly (both are dependency-free .mjs, so
// `node --test` can import them without a bundler or TS path aliases — see
// AGENTS.md "KNOWN GAP - no test framework configured").
//
// Run: node --test scripts/tests/telegram-approvals-to-dm.test.mjs

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { loadTelegramConfig } from '../../src/lib/axon/config.mjs';
import { isAuthorizedChat } from '../../src/lib/axon/telegram-auth.mjs';

// --- loadTelegramConfig: telegramChatId must always be the private DM -----

function fakeSbSelect(secrets) {
  return async (table, query) => {
    const match = /key=eq\.([^&]+)/.exec(query || '');
    const key = match ? decodeURIComponent(match[1]) : null;
    const value = secrets[key];
    return value == null ? [] : [{ value }];
  };
}

test('loadTelegramConfig: telegramChatId is the private DM even when the group + approvals thread are both provisioned', async () => {
  const sbSelect = fakeSbSelect({
    TELEGRAM_BOT_TOKEN: 'tok-default',
    TELEGRAM_CHAT_ID: 'DM-JB-PRIVATE',
    TELEGRAM_WEBHOOK_SECRET: 'whsecret',
    TELEGRAM_GROUP_CHAT_ID: 'GROUP-NVG-AGENTS',
    TELEGRAM_APPROVALS_THREAD_ID: '80',
  });

  const cfg = await loadTelegramConfig(undefined, sbSelect);

  assert.equal(cfg.telegramChatId, 'DM-JB-PRIVATE', 'JB-facing chat id must be the private DM, not the group');
  assert.equal(cfg.telegramDmChatId, 'DM-JB-PRIVATE');
  assert.equal(cfg.telegramGroupChatId, 'GROUP-NVG-AGENTS', 'group id is still resolved for non-JB chatter');
  assert.equal(cfg.telegramApprovalsThreadId, '80', 'thread id is still resolved (unused for routing) until the retirement ticket removes it');
});

test('loadTelegramConfig: telegramChatId is the private DM when only the DM is configured (no group)', async () => {
  const sbSelect = fakeSbSelect({
    TELEGRAM_BOT_TOKEN: 'tok-default',
    TELEGRAM_CHAT_ID: 'DM-JB-PRIVATE',
    TELEGRAM_WEBHOOK_SECRET: 'whsecret',
  });

  const cfg = await loadTelegramConfig(undefined, sbSelect);

  assert.equal(cfg.telegramChatId, 'DM-JB-PRIVATE');
  assert.equal(cfg.telegramGroupChatId, null);
  assert.equal(cfg.telegramApprovalsThreadId, null);
});

test('loadTelegramConfig: an agent-specific bot with all three secrets set is unaffected by the DM-first change', async () => {
  const sbSelect = fakeSbSelect({
    TELEGRAM_BOT_TOKEN: 'tok-default',
    TELEGRAM_CHAT_ID: 'DM-JB-PRIVATE',
    TELEGRAM_WEBHOOK_SECRET: 'whsecret',
    TELEGRAM_BOT_TOKEN_ARCEUS: 'tok-arceus',
    TELEGRAM_CHAT_ID_ARCEUS: 'CHAT-ARCEUS',
    TELEGRAM_WEBHOOK_SECRET_ARCEUS: 'whsecret-arceus',
  });

  const cfg = await loadTelegramConfig('arceus', sbSelect);

  assert.equal(cfg.telegramToken, 'tok-arceus');
  assert.equal(cfg.telegramChatId, 'CHAT-ARCEUS');
});

// --- isAuthorizedChat: private DM stays authorized alongside the group ----

test('isAuthorizedChat: accepts the private DM chat id', () => {
  const cfg = { telegramChatId: 'DM-JB-PRIVATE', telegramDmChatId: 'DM-JB-PRIVATE', telegramGroupChatId: 'GROUP-NVG-AGENTS' };
  assert.equal(isAuthorizedChat(cfg, 'DM-JB-PRIVATE'), true);
});

test('isAuthorizedChat: still accepts the group chat id (agent-to-agent chatter may remain there)', () => {
  const cfg = { telegramChatId: 'DM-JB-PRIVATE', telegramDmChatId: 'DM-JB-PRIVATE', telegramGroupChatId: 'GROUP-NVG-AGENTS' };
  assert.equal(isAuthorizedChat(cfg, 'GROUP-NVG-AGENTS'), true);
});

test('isAuthorizedChat: rejects an unrelated chat id when at least one chat is configured', () => {
  const cfg = { telegramChatId: 'DM-JB-PRIVATE', telegramDmChatId: 'DM-JB-PRIVATE', telegramGroupChatId: null };
  assert.equal(isAuthorizedChat(cfg, 'SOME-RANDOM-CHAT'), false);
});

test('isAuthorizedChat: open (true) when no chat is configured at all, matching the pre-existing unconfigured-bot behavior', () => {
  const cfg = { telegramChatId: null, telegramDmChatId: null, telegramGroupChatId: null };
  assert.equal(isAuthorizedChat(cfg, 'ANYTHING'), true);
});
