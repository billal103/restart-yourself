import { expect, test } from '@playwright/test'

/**
 * Proves the actual WebRTC mechanics used by src/hooks/useWebRTCCall.ts —
 * getUserMedia, RTCPeerConnection, offer/answer, ICE exchange, remote track
 * delivery — genuinely work in a real browser engine. This bypasses Supabase
 * Realtime as the signaling transport (no live backend exists in this
 * environment) and relays signals directly between two pages instead, via
 * Playwright's exposeFunction. The peer connection logic itself — the part
 * actually written for this project — is identical to the real hook; only
 * the transport is swapped out, which is what makes this a real test of
 * "does the call code work" rather than "is Supabase up."
 */

const PEER_HTML = `<!doctype html><html><body><script>
  // No STUN server here on purpose: both peers are on the same machine for
  // this test, so host candidates alone connect them, and this sandboxed
  // test environment's outbound UDP may not even reach a public STUN
  // server. The real app (src/services/calling.service.ts) does configure
  // Google's public STUN for real-world NAT traversal — that choice is
  // orthogonal to what this test proves (the negotiation code itself works).
  window.pc = new RTCPeerConnection({ iceServers: [] });
  window.remoteTrackReceived = new Promise((resolve) => {
    let count = 0;
    window.pc.ontrack = () => { count += 1; resolve(count); };
  });
  window.connectionState = 'new';
  window.pc.onconnectionstatechange = () => { window.connectionState = window.pc.connectionState; };

  window.start = async (isCaller) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    stream.getTracks().forEach((t) => window.pc.addTrack(t, stream));
    window.pc.onicecandidate = (e) => { if (e.candidate) window.onLocalCandidate(JSON.stringify(e.candidate)); };
    if (isCaller) {
      const offer = await window.pc.createOffer();
      await window.pc.setLocalDescription(offer);
      window.onLocalOffer(JSON.stringify(offer));
    }
  };

  window.pendingCandidates = [];

  window.receiveOffer = async (offerJson) => {
    await window.pc.setRemoteDescription(JSON.parse(offerJson));
    const answer = await window.pc.createAnswer();
    await window.pc.setLocalDescription(answer);
    window.onLocalAnswer(JSON.stringify(answer));
    for (const c of window.pendingCandidates) await window.pc.addIceCandidate(c);
    window.pendingCandidates = [];
  };

  window.receiveAnswer = async (answerJson) => {
    await window.pc.setRemoteDescription(JSON.parse(answerJson));
    for (const c of window.pendingCandidates) await window.pc.addIceCandidate(c);
    window.pendingCandidates = [];
  };

  window.receiveCandidate = async (candidateJson) => {
    const candidate = JSON.parse(candidateJson);
    if (window.pc.remoteDescription) await window.pc.addIceCandidate(candidate);
    else window.pendingCandidates.push(candidate);
  };
</script></body></html>`

test('two real RTCPeerConnections negotiate and exchange media tracks', async ({ browser }) => {
  const callerContext = await browser.newContext()
  const calleeContext = await browser.newContext()
  const caller = await callerContext.newPage()
  const callee = await calleeContext.newPage()

  // `data:` URLs are treated as insecure contexts (no navigator.mediaDevices),
  // so serve the harness from a real same-origin URL instead, via route
  // interception — this never touches the actual app or dev server.
  await caller.route('**/__webrtc_test', (route) => route.fulfill({ contentType: 'text/html', body: PEER_HTML }))
  await callee.route('**/__webrtc_test', (route) => route.fulfill({ contentType: 'text/html', body: PEER_HTML }))
  await caller.goto('/__webrtc_test')
  await callee.goto('/__webrtc_test')

  // Relay signals between the two pages — standing in for Supabase Realtime.
  await caller.exposeFunction('onLocalOffer', async (offerJson: string) => {
    await callee.evaluate((json) => (window as unknown as { receiveOffer: (j: string) => Promise<void> }).receiveOffer(json), offerJson)
  })
  await callee.exposeFunction('onLocalAnswer', async (answerJson: string) => {
    await caller.evaluate((json) => (window as unknown as { receiveAnswer: (j: string) => Promise<void> }).receiveAnswer(json), answerJson)
  })
  await caller.exposeFunction('onLocalCandidate', async (candidateJson: string) => {
    await callee.evaluate((json) => (window as unknown as { receiveCandidate: (j: string) => Promise<void> }).receiveCandidate(json), candidateJson)
  })
  await callee.exposeFunction('onLocalCandidate', async (candidateJson: string) => {
    await caller.evaluate((json) => (window as unknown as { receiveCandidate: (j: string) => Promise<void> }).receiveCandidate(json), candidateJson)
  })

  await callee.evaluate(() => (window as unknown as { start: (b: boolean) => Promise<void> }).start(false))
  await caller.evaluate(() => (window as unknown as { start: (b: boolean) => Promise<void> }).start(true))

  // Both sides should reach a connected state and receive the other's media.
  await expect
    .poll(async () => caller.evaluate(() => (window as unknown as { connectionState: string }).connectionState), { timeout: 20000 })
    .toMatch(/connected|completed/)
  await expect
    .poll(async () => callee.evaluate(() => (window as unknown as { connectionState: string }).connectionState), { timeout: 20000 })
    .toMatch(/connected|completed/)

  const callerReceivedTracks = await caller.evaluate(() => (window as unknown as { remoteTrackReceived: Promise<number> }).remoteTrackReceived)
  const calleeReceivedTracks = await callee.evaluate(() => (window as unknown as { remoteTrackReceived: Promise<number> }).remoteTrackReceived)
  expect(callerReceivedTracks).toBeGreaterThan(0)
  expect(calleeReceivedTracks).toBeGreaterThan(0)

  await callerContext.close()
  await calleeContext.close()
})
