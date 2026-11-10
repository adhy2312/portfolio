import { test, describe } from 'node:test';
import assert from 'node:assert';
import { parseEnv } from '../src/config/env.js';

describe('Backend Foundation — Configuration Validation', () => {
  test('Parses valid configuration with intelligent defaults', () => {
    const config = parseEnv({
      NODE_ENV: 'test',
      PORT: '3005'
    });

    assert.strictEqual(config.NODE_ENV, 'test');
    assert.strictEqual(config.PORT, 3005);
    assert.strictEqual(config.HOST, '127.0.0.1');
    assert.ok(config.allowedOriginsList.includes('https://adhy.tech'));
  });

  test('Missing optional provider keys do not prevent configuration validation or startup', () => {
    const config = parseEnv({
      NODE_ENV: 'development',
      PORT: '3001'
      // Omit GEMINI_API_KEY, GROQ_API_KEY, SUPABASE_URL, etc.
    });

    assert.strictEqual(config.GEMINI_API_KEY, undefined);
    assert.strictEqual(config.GROQ_API_KEY, undefined);
    assert.strictEqual(config.SUPABASE_URL, undefined);
    assert.ok(config.PORT === 3001);
  });

  test('Invalid port fails fast with descriptive error', () => {
    assert.throws(
      () => {
        parseEnv({
          PORT: '999999' // Invalid port > 65535
        });
      },
      (err: Error) => {
        assert.ok(err.message.includes('[Configuration Error]'));
        assert.ok(err.message.includes('PORT'));
        return true;
      }
    );
  });

  test('Invalid Supabase URL fails fast with descriptive error', () => {
    assert.throws(
      () => {
        parseEnv({
          SUPABASE_URL: 'not-a-valid-url'
        });
      },
      (err: Error) => {
        assert.ok(err.message.includes('[Configuration Error]'));
        assert.ok(err.message.includes('SUPABASE_URL'));
        return true;
      }
    );
  });
});
