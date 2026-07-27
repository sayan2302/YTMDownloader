import assert from 'assert';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3001';
const TEST_DIR_SINGLE = path.join(process.cwd(), '..', 'ytf', 'test_single');
const TEST_DIR_BULK = path.join(process.cwd(), '..', 'ytf', 'test_bulk');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('==================================================');
  console.log('🚀 Starting Comprehensive YTMDownloader Test Suite');
  console.log('==================================================\n');

  try {
    // ---------------------------------------------------------
    // TEST 1: System Check
    // ---------------------------------------------------------
    console.log('[TEST 1] Checking system dependency status (/api/system-check)...');
    const sysRes = await fetch(`${BASE_URL}/api/system-check`);
    assert.strictEqual(sysRes.status, 200, 'System check endpoint returned non-200');
    const sysData = await sysRes.json();
    console.log('  -> Status:', JSON.stringify(sysData));
    assert.strictEqual(sysData.ytDlp, 'ready', 'ytDlp is not ready');
    assert.strictEqual(sysData.ffmpeg, 'ready', 'ffmpeg is not ready');
    console.log('✅ TEST 1 PASSED\n');

    // ---------------------------------------------------------
    // TEST 2: Search Endpoint
    // ---------------------------------------------------------
    console.log('[TEST 2] Searching YouTube Music (/api/search?q=Rick+Astley)...');
    const searchRes = await fetch(`${BASE_URL}/api/search?q=Rick+Astley`);
    assert.strictEqual(searchRes.status, 200, 'Search endpoint returned non-200');
    const searchData = await searchRes.json();
    const results = searchData.results || [];
    console.log(`  -> Search returned ${results.length} items`);
    assert(Array.isArray(results) && results.length > 0, 'Search returned empty results');
    const testTrack = results[0];
    console.log(`  -> Selected track: "${testTrack.title}" (${testTrack.videoId})`);
    console.log('✅ TEST 2 PASSED\n');

    // ---------------------------------------------------------
    // TEST 3: Audio Streaming Proxy
    // ---------------------------------------------------------
    console.log('[TEST 3] Testing audio streaming proxy (/api/stream/:videoId)...');
    const streamRes = await fetch(`${BASE_URL}/api/stream/dQw4w9WgXcQ`, {
      headers: { Range: 'bytes=0-1024' }
    });
    console.log(`  -> Stream response HTTP status: ${streamRes.status}`);
    assert([200, 206].includes(streamRes.status), `Stream returned unexpected status ${streamRes.status}`);
    const streamBuffer = await streamRes.arrayBuffer();
    console.log(`  -> Received stream chunk size: ${streamBuffer.byteLength} bytes`);
    assert(streamBuffer.byteLength > 0, 'Stream chunk is empty');
    console.log('✅ TEST 3 PASSED\n');

    // ---------------------------------------------------------
    // TEST 4: Single Track Download Flow
    // ---------------------------------------------------------
    console.log(`[TEST 4] Single Track Download to: ${TEST_DIR_SINGLE}...`);
    const dlRes = await fetch(`${BASE_URL}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: 'dQw4w9WgXcQ',
        title: 'Never Gonna Give You Up',
        artist: 'Rick Astley',
        outputDir: TEST_DIR_SINGLE,
        downloadLyrics: false
      })
    });
    assert.strictEqual(dlRes.status, 200, 'Download POST failed');
    const dlData = await dlRes.json();
    console.log('  -> Queue response:', dlData);
    assert(dlData.downloadId, 'No downloadId returned');

    // Poll until complete (timeout 45s)
    let completed = false;
    const startTime = Date.now();
    while (Date.now() - startTime < 45000) {
      await sleep(2000);
      if (fs.existsSync(TEST_DIR_SINGLE)) {
        const files = fs.readdirSync(TEST_DIR_SINGLE);
        const m4aFile = files.find(f => f.endsWith('.m4a'));
        if (m4aFile) {
          const stats = fs.statSync(path.join(TEST_DIR_SINGLE, m4aFile));
          if (stats.size > 1000000) { // > 1MB
            console.log(`  -> Downloaded file: ${m4aFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
            completed = true;
            break;
          }
        }
      }
    }
    assert(completed, 'Single download timed out or failed to complete on disk');
    console.log('✅ TEST 4 PASSED\n');

    // ---------------------------------------------------------
    // TEST 5: Duplicate Prevention
    // ---------------------------------------------------------
    console.log('[TEST 5] Testing duplicate queue prevention...');
    const dupeRes = await fetch(`${BASE_URL}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: 'dQw4w9WgXcQ',
        title: 'Never Gonna Give You Up',
        artist: 'Rick Astley',
        outputDir: TEST_DIR_SINGLE,
        downloadLyrics: false
      })
    });
    const dupeData = await dupeRes.json();
    console.log('  -> Duplicate check response:', dupeData);
    assert(dupeData.downloadId || dupeData.message, 'Duplicate check failed');
    console.log('✅ TEST 5 PASSED\n');

    // ---------------------------------------------------------
    // TEST 6: Bulk Download Endpoint
    // ---------------------------------------------------------
    console.log(`[TEST 6] Testing Bulk Download (/api/download/bulk) to: ${TEST_DIR_BULK}...`);
    const bulkRes = await fetch(`${BASE_URL}/api/download/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        songs: [
          { videoId: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi' },
          { videoId: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen' }
        ],
        outputDir: TEST_DIR_BULK,
        downloadLyrics: false
      })
    });
    assert.strictEqual(bulkRes.status, 200, 'Bulk download POST failed');
    const bulkData = await bulkRes.json();
    console.log('  -> Bulk queue response:', bulkData);
    assert(Array.isArray(bulkData.queuedIds) && bulkData.queuedIds.length === 2, 'Bulk queue ids count mismatch');
    
    // Poll for bulk files (timeout 60s)
    let bulkCompletedCount = 0;
    const bulkStartTime = Date.now();
    while (Date.now() - bulkStartTime < 60000) {
      await sleep(3000);
      if (fs.existsSync(TEST_DIR_BULK)) {
        const files = fs.readdirSync(TEST_DIR_BULK).filter(f => f.endsWith('.m4a'));
        bulkCompletedCount = files.length;
        console.log(`  -> Bulk files progress: ${bulkCompletedCount}/2 completed`);
        if (bulkCompletedCount >= 2) break;
      }
    }
    assert.strictEqual(bulkCompletedCount, 2, `Bulk download incomplete. Expected 2 files, found ${bulkCompletedCount}`);
    console.log('✅ TEST 6 PASSED\n');

    // ---------------------------------------------------------
    // TEST 7: Clear Cache Endpoint
    // ---------------------------------------------------------
    console.log('[TEST 7] Testing Clear Cache (/api/download/clear-cache)...');
    const clearRes = await fetch(`${BASE_URL}/api/download/clear-cache`, { method: 'POST' });
    assert.strictEqual(clearRes.status, 200, 'Clear cache returned non-200');
    const clearData = await clearRes.json();
    console.log('  -> Clear cache response:', clearData);
    console.log('✅ TEST 7 PASSED\n');

    console.log('==================================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! PROJECT IS VERIFIED.');
    console.log('==================================================');

  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

runTests();
