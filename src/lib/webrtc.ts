// WebRTC Peer-to-Peer Audio & Screen Sharing Manager

export interface WebRTCManagerCallbacks {
  onSignal: (toUserId: string, signal: any) => void;
  onSpeakingChange: (isSpeaking: boolean) => void;
  onRemoteStream: (peerId: string, stream: MediaStream) => void;
  onRemoteStreamRemoved: (peerId: string) => void;
  onAudioLevel: (level: number) => void;
  onError: (msg: string) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private audioElements = new Map<string, HTMLAudioElement>();
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private isSpeaking = false;
  private silenceTimer: any = null;
  private isMuted = false;
  private isDeafened = false;
  private callbacks: WebRTCManagerCallbacks;

  constructor(callbacks: WebRTCManagerCallbacks) {
    this.callbacks = callbacks;
  }

  // Initialize local microphone
  async startLocalAudio(): Promise<boolean> {
    try {
      if (!this.localStream) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
      }

      this.setupAudioAnalysis(this.localStream);
      return true;
    } catch (err: any) {
      console.warn('Microphone permission or hardware unavailable, fallback to test audio:', err);
      this.setupSimulatedAudio();
      this.callbacks.onError(
        'マイクへのアクセスが制限されているか未接続です（テスト音声モードで動作中）'
      );
      return false;
    }
  }

  // Setup Web Audio analyser to measure RMS volume & detect speaking
  private setupAudioAnalysis(stream: MediaStream) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));

        this.callbacks.onAudioLevel(this.isMuted ? 0 : normalized);

        // Speaking detection (threshold ~ 12)
        if (normalized > 12 && !this.isMuted) {
          if (!this.isSpeaking) {
            this.isSpeaking = true;
            this.callbacks.onSpeakingChange(true);
          }
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
        } else {
          if (this.isSpeaking && !this.silenceTimer) {
            this.silenceTimer = setTimeout(() => {
              this.isSpeaking = false;
              this.callbacks.onSpeakingChange(false);
              this.silenceTimer = null;
            }, 350);
          }
        }

        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      this.animFrameId = requestAnimationFrame(checkVolume);
    } catch (e) {
      console.error('Failed to setup audio analysis:', e);
    }
  }

  private setupSimulatedAudio() {
    // If no mic is available, create silent/test track so WebRTC can still negotiate
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      const osc = this.audioCtx.createOscillator();
      const dst = this.audioCtx.createMediaStreamDestination();
      const gain = this.audioCtx.createGain();
      gain.gain.value = 0; // silent
      osc.connect(gain);
      gain.connect(dst);
      osc.start();
      this.localStream = dst.stream;
    } catch (e) {
      console.warn('Could not create simulated audio stream:', e);
    }
  }

  // Create or retrieve PeerConnection for a remote peer
  private getOrCreatePeer(peerId: string): RTCPeerConnection {
    let pc = this.peerConnections.get(peerId);
    if (pc) return pc;

    pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(peerId, pc);

    // Add local audio track
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc!.addTrack(track, this.localStream!);
      });
    }

    // Add screen track if sharing
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => {
        pc!.addTrack(track, this.screenStream!);
      });
    }

    // ICE Candidates
    pc.onicecandidate = event => {
      if (event.candidate) {
        this.callbacks.onSignal(peerId, {
          type: 'candidate',
          candidate: event.candidate,
        });
      }
    };

    // Remote Track received
    pc.ontrack = event => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        this.callbacks.onRemoteStream(peerId, remoteStream);

        // Attach audio element
        let audioEl = this.audioElements.get(peerId);
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          this.audioElements.set(peerId, audioEl);
        }
        audioEl.srcObject = remoteStream;
        audioEl.muted = this.isDeafened;
        audioEl.play().catch(e => console.warn('Autoplay prevented:', e));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc!.connectionState === 'disconnected' || pc!.connectionState === 'failed' || pc!.connectionState === 'closed') {
        this.removePeer(peerId);
      }
    };

    return pc;
  }

  // Initiate an offer to another peer
  async connectToPeer(peerId: string) {
    try {
      const pc = this.getOrCreatePeer(peerId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.callbacks.onSignal(peerId, {
        type: 'offer',
        sdp: pc.localDescription,
      });
    } catch (e) {
      console.error(`Error connecting to peer ${peerId}:`, e);
    }
  }

  // Handle incoming signaling messages (offer, answer, candidate)
  async handleSignal(fromPeerId: string, signal: any) {
    try {
      const pc = this.getOrCreatePeer(fromPeerId);

      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.callbacks.onSignal(fromPeerId, {
          type: 'answer',
          sdp: pc.localDescription,
        });
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      } else if (signal.type === 'candidate') {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (e) {
      console.error(`Error handling signal from ${fromPeerId}:`, e);
    }
  }

  // Mute / Unmute local microphone
  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(t => {
        t.enabled = !muted;
      });
    }
    if (muted && this.isSpeaking) {
      this.isSpeaking = false;
      this.callbacks.onSpeakingChange(false);
    }
  }

  // Deafen / Undeafen (mutes incoming audio & outgoing mic)
  setDeafened(deafened: boolean) {
    this.isDeafened = deafened;
    this.audioElements.forEach(audio => {
      audio.muted = deafened;
    });
    if (deafened) {
      this.setMuted(true);
    }
  }

  // Toggle Screen Share
  async toggleScreenShare(): Promise<MediaStream | null> {
    if (this.screenStream) {
      // Stop sharing
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
      // Remove track from all peer connections
      this.peerConnections.forEach(pc => {
        const senders = pc.getSenders();
        senders.forEach(sender => {
          if (sender.track && sender.track.kind === 'video') {
            pc.removeTrack(sender);
          }
        });
      });
      return null;
    } else {
      try {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        const videoTrack = this.screenStream.getVideoTracks()[0];
        videoTrack.onended = () => {
          this.toggleScreenShare();
        };

        // Add track to all active peer connections
        this.peerConnections.forEach(pc => {
          if (this.screenStream) {
            pc.addTrack(videoTrack, this.screenStream);
            // Renegotiate
            pc.createOffer().then(offer => {
              pc.setLocalDescription(offer);
            });
          }
        });

        return this.screenStream;
      } catch (err) {
        console.warn('Screen share cancelled or failed:', err);
        return null;
      }
    }
  }

  // Set remote user volume (0.0 to 1.0)
  setPeerVolume(peerId: string, volume: number) {
    const audio = this.audioElements.get(peerId);
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  removePeer(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    const audio = this.audioElements.get(peerId);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
      this.audioElements.delete(peerId);
    }
    this.callbacks.onRemoteStreamRemoved(peerId);
  }

  // Cleanup all streams and peer connections
  destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    this.audioElements.forEach(a => {
      a.srcObject = null;
      a.remove();
    });
    this.audioElements.clear();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
