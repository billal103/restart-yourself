import { useEffect, useRef, useState } from 'react'
import { callingService, ICE_SERVERS, type CallSignalRow } from '@/services/calling.service'

export type CallConnectionState = 'idle' | 'requesting-media' | 'connecting' | 'connected' | 'failed' | 'ended'

interface UseWebRTCCallOptions {
  callId: string
  userId: string
  /** The person who placed the call creates the offer; the other side answers. */
  isCaller: boolean
  type: 'voice' | 'video'
  enabled: boolean
}

interface UseWebRTCCallResult {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  state: CallConnectionState
  error: string | null
  setMuted: (muted: boolean) => void
  setCameraOn: (on: boolean) => void
  hangUp: () => void
}

/**
 * Real getUserMedia + RTCPeerConnection negotiation, signaled through the
 * call_signals table (see supabase/migrations) via Supabase Realtime.
 * STUN-only (see services/calling.service.ts) — some calls across
 * restrictive NATs will fail without a TURN server, which this project
 * does not provision. That is a documented limitation, not a bug: see
 * docs/ARCHITECTURE.md.
 *
 * Only runs when `enabled` is true (i.e. a real Supabase project is
 * configured) — CallInterfacePage falls back to a simulated UI otherwise.
 */
export function useWebRTCCall({ callId, userId, isCaller, type, enabled }: UseWebRTCCallOptions): UseWebRTCCallResult {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [state, setState] = useState<CallConnectionState>('idle')
  const [error, setError] = useState<string | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const remoteDescriptionSetRef = useRef(false)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    let unsubscribe: (() => void) | null = null
    let stream: MediaStream | null = null

    async function setup() {
      setState('requesting-media')
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' })
      } catch {
        if (!cancelled) {
          setError('Camera or microphone permission was denied.')
          setState('failed')
        }
        return
      }
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      setLocalStream(stream)

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      pcRef.current = pc
      setState('connecting')

      stream.getTracks().forEach((track) => pc.addTrack(track, stream!))

      const remote = new MediaStream()
      pc.ontrack = (event) => {
        for (const track of event.streams[0]?.getTracks() ?? []) remote.addTrack(track)
        setRemoteStream(new MediaStream(remote.getTracks()))
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setState('connected')
        else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') setState('failed')
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          void callingService.sendSignal(callId, userId, 'ice-candidate', event.candidate.toJSON())
        }
      }

      unsubscribe = callingService.subscribeToSignals(callId, (signal: CallSignalRow) => {
        if (signal.sender_id === userId) return
        void handleSignal(pc, signal)
      })

      if (isCaller) {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        await callingService.sendSignal(callId, userId, 'offer', offer)
      }
    }

    async function handleSignal(pc: RTCPeerConnection, signal: CallSignalRow) {
      try {
        if (signal.signal_type === 'offer') {
          await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit)
          remoteDescriptionSetRef.current = true
          await drainPendingCandidates(pc)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          await callingService.sendSignal(callId, userId, 'answer', answer)
        } else if (signal.signal_type === 'answer') {
          await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit)
          remoteDescriptionSetRef.current = true
          await drainPendingCandidates(pc)
        } else if (signal.signal_type === 'ice-candidate') {
          const candidate = signal.payload as RTCIceCandidateInit
          if (remoteDescriptionSetRef.current) {
            await pc.addIceCandidate(candidate)
          } else {
            pendingCandidatesRef.current.push(candidate)
          }
        }
      } catch {
        // A late or duplicate signal failing to apply isn't fatal to the
        // call; surfacing it would be noisier than useful.
      }
    }

    async function drainPendingCandidates(pc: RTCPeerConnection) {
      const queued = pendingCandidatesRef.current
      pendingCandidatesRef.current = []
      for (const candidate of queued) {
        await pc.addIceCandidate(candidate).catch(() => {})
      }
    }

    void setup()

    return () => {
      cancelled = true
      unsubscribe?.()
      pcRef.current?.close()
      pcRef.current = null
      stream?.getTracks().forEach((track) => track.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId, enabled])

  function setMuted(muted: boolean) {
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted
    })
  }

  function setCameraOn(on: boolean) {
    localStream?.getVideoTracks().forEach((track) => {
      track.enabled = on
    })
  }

  function hangUp() {
    pcRef.current?.close()
    localStream?.getTracks().forEach((track) => track.stop())
    setState('ended')
  }

  return { localStream, remoteStream, state, error, setMuted, setCameraOn, hangUp }
}
