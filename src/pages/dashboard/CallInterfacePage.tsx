import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { useWebRTCCall } from '@/hooks/useWebRTCCall'
import { conversations } from '@/lib/mockData'
import { useAuthStore } from '@/stores/authStore'

function useCallClock(active: boolean) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [active])
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

function VideoTile({ stream, muted }: { stream: MediaStream | null; muted: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className="h-64 w-full max-w-md rounded-card bg-black/40 object-cover"
    />
  )
}

export default function CallInterfacePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const callType = searchParams.get('type') === 'video' ? 'video' : 'voice'
  const isCaller = searchParams.get('role') !== 'callee'

  const [simulatedStatus, setSimulatedStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing')
  const [muted, setMuted] = useState(false)
  const [cameraOn, setCameraOn] = useState(callType === 'video')

  const real = useWebRTCCall({
    callId: sessionId ?? '',
    userId: user?.id ?? '',
    isCaller,
    type: callType,
    enabled: isSupabaseConfigured && Boolean(sessionId) && Boolean(user),
  })

  const connected = isSupabaseConfigured ? real.state === 'connected' : simulatedStatus === 'connected'
  const ended = isSupabaseConfigured ? real.state === 'ended' : simulatedStatus === 'ended'
  const duration = useCallClock(connected)

  const participant = conversations[0]?.participant
  if (!sessionId || !participant) return <Navigate to="/dashboard/messages" replace />

  function handleToggleMute() {
    setMuted((v) => {
      if (isSupabaseConfigured) real.setMuted(!v)
      return !v
    })
  }

  function handleToggleCamera() {
    setCameraOn((v) => {
      if (isSupabaseConfigured) real.setCameraOn(!v)
      return !v
    })
  }

  function handleEndCall() {
    if (isSupabaseConfigured && sessionId) {
      real.hangUp()
      void import('@/services/calling.service').then(({ callingService }) => callingService.updateStatus(sessionId, 'ended'))
    } else {
      setSimulatedStatus('ended')
    }
  }

  if (ended) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-center">
        <PhoneOff className="size-10 text-text-muted" />
        <h1 className="text-xl font-semibold text-text-primary">Call ended</h1>
        <p className="text-sm text-text-secondary">Duration: {duration}</p>
        <Button className="mt-4" onClick={() => navigate('/dashboard/messages')}>
          Back to Conversations
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 rounded-card bg-primary-900 py-16 text-white">
      {isSupabaseConfigured && real.error && (
        <p className="rounded-lg bg-error-500/20 px-4 py-2 text-sm text-error-50">{real.error}</p>
      )}

      {callType === 'video' && cameraOn && isSupabaseConfigured && real.remoteStream ? (
        <VideoTile stream={real.remoteStream} muted={false} />
      ) : callType === 'video' && cameraOn && connected ? (
        <div className="flex h-64 w-full max-w-md items-center justify-center rounded-card bg-black/40">
          <p className="text-sm text-primary-100">Waiting for the other person's video…</p>
        </div>
      ) : (
        <div className="flex size-28 items-center justify-center rounded-full bg-primary-700 text-3xl font-semibold">
          {participant.displayName.slice(0, 2).toUpperCase()}
        </div>
      )}

      <div className="text-center">
        <h1 className="text-xl font-semibold">{participant.displayName}</h1>
        <p className="mt-1 text-sm text-primary-100">
          {!connected
            ? isSupabaseConfigured
              ? real.state === 'requesting-media'
                ? 'Requesting camera/microphone access…'
                : callType === 'video'
                  ? 'Calling… waiting for them to accept the video call'
                  : 'Calling… waiting for them to accept'
              : callType === 'video'
                ? 'Calling… waiting for them to accept the video call'
                : 'Calling… waiting for them to accept'
            : `Connected · ${duration}`}
        </p>
      </div>

      {!connected && !isSupabaseConfigured ? (
        <div className="flex gap-4">
          <Button variant="destructive" size="lg" onClick={() => setSimulatedStatus('ended')}>
            <PhoneOff className="size-4" /> Cancel
          </Button>
          <Button size="lg" onClick={() => setSimulatedStatus('connected')}>
            Simulate Accept
          </Button>
        </div>
      ) : !connected && isSupabaseConfigured ? (
        <Button variant="destructive" size="lg" onClick={handleEndCall}>
          <PhoneOff className="size-4" /> Cancel
        </Button>
      ) : (
        <div className="flex gap-4">
          <Button
            variant="secondary"
            size="icon"
            aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
            onClick={handleToggleMute}
          >
            {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </Button>
          {callType === 'video' && (
            <Button
              variant="secondary"
              size="icon"
              aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
              onClick={handleToggleCamera}
            >
              {cameraOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
            </Button>
          )}
          <Button variant="destructive" size="icon" aria-label="End call" onClick={handleEndCall}>
            <PhoneOff className="size-5" />
          </Button>
        </div>
      )}

      <p className="max-w-sm text-center text-xs text-primary-200">
        This call is not recorded. Connection quality depends on your network — see Known
        Limitations in the docs for why some networks need a paid TURN server we don't provision.
      </p>
    </div>
  )
}
