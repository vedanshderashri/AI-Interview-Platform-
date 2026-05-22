'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  X,
  Phone,
  Users,
  MessageCircle,
  Settings,
  Hand,
  Copy,
  Wifi,
  WifiOff,
  Radio,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Participant } from '@/store/meetingStore';
import { getSocket } from '@/lib/socket';

interface VideoCallInterfaceProps {
  participants: Participant[];
  meetingCode: string;
  meetingTitle: string;
  createdBy: string;
  yourName: string;
  onHangUp: () => void;
  onCopyCode: () => void;
}

interface RemoteParticipant {
  name: string;
  stream?: MediaStream;
  id: string;
}

export function VideoCallInterface({
  participants,
  meetingCode,
  meetingTitle,
  createdBy,
  yourName,
  onHangUp,
  onCopyCode,
}: VideoCallInterfaceProps) {
  // UI State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [speakerMode, setSpeakerMode] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ user: string; text: string; time: Date }[]>([
    { user: 'System', text: 'Meeting started', time: new Date() },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [raisedHand, setRaisedHand] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'good' | 'fair' | 'poor'>('good');

  // Media & WebRTC State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<Map<string, string>>(new Map());

  // Refs
  const socket = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const connectedPeersRef = useRef<Set<string>>(new Set());
  const signalQueueRef = useRef<Map<string, any[]>>(new Map());
  const peersInitializedRef = useRef<Set<string>>(new Set());
  const peerConnectionStateRef = useRef<Map<string, 'connecting' | 'connected' | 'failed'>>(new Map());
  const processedSignalsRef = useRef<Set<string>>(new Set());

  // Initialize local media stream
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Apply initial mic/camera settings
        stream.getAudioTracks().forEach((track) => {
          track.enabled = isMicOn;
        });
        stream.getVideoTracks().forEach((track) => {
          track.enabled = isCameraOn;
        });
      } catch (error) {
        console.error('Failed to get media stream:', error);
        alert('Please enable camera and microphone access to join the meeting.');
      }
    };

    initMedia();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Update mic state
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });
    }
  }, [isMicOn, localStream]);

  // Update camera state
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOn;
      });
    }
  }, [isCameraOn, localStream]);

  // Create peer connection
  const createPeerConnection = useCallback(
    (peerId: string, initiator: boolean) => {
      if (peersRef.current.has(peerId)) {
        console.log(`Peer connection already exists for ${peerId}`);
        return;
      }
      if (!localStream) {
        console.log(`Local stream not ready for ${peerId}`);
        return;
      }

      console.log(`Creating peer connection for ${peerId}, initiator: ${initiator}, local stream tracks: video=${localStream.getVideoTracks().length}, audio=${localStream.getAudioTracks().length}`);

      try {
        peerConnectionStateRef.current.set(peerId, 'connecting');
        
        const peer = new SimplePeer({
          initiator,
          trickle: false,
          streams: [localStream],
          config: {
            iceServers: [
              { urls: ['stun:stun.l.google.com:19302'] },
              { urls: ['stun:stun1.l.google.com:19302'] },
            ],
          },
        });

        peer.on('signal', (data: any) => {
          if (data.type === 'offer') {
            console.log(`Sending offer for ${peerId}`);
            socket.current?.emit('offer', { code: meetingCode, to: peerId, offer: data, fromName: yourName });
          } else if (data.type === 'answer') {
            console.log(`Sending answer for ${peerId}`);
            socket.current?.emit('answer', { code: meetingCode, to: peerId, answer: data, fromName: yourName });
          } else if (data.candidate) {
            socket.current?.emit('ice-candidate', {
              code: meetingCode,
              to: peerId,
              candidate: data,
              fromName: yourName,
            });
          }
        });

        peer.on('stream', (stream: MediaStream) => {
          console.log(`Received stream from ${peerId}, tracks:`, {
            video: stream.getVideoTracks().length,
            audio: stream.getAudioTracks().length,
          });
          setRemoteStreams((prev) => new Map(prev).set(peerId, stream));
          setConnectionStatus((prev) => new Map(prev).set(peerId, 'connected'));
          peerConnectionStateRef.current.set(peerId, 'connected');
          connectedPeersRef.current.add(peerId);
        });

        peer.on('error', (err: Error) => {
          console.error(`Peer error with ${peerId}:`, err);
          peerConnectionStateRef.current.set(peerId, 'failed');
          setConnectionStatus((prev) => new Map(prev).set(peerId, 'error'));
        });

        peer.on('close', () => {
          peersRef.current.delete(peerId);
          connectedPeersRef.current.delete(peerId);
          peersInitializedRef.current.delete(peerId);
          peerConnectionStateRef.current.delete(peerId);
          signalQueueRef.current.delete(peerId);
          processedSignalsRef.current.delete(`offer-${peerId}`);
          processedSignalsRef.current.delete(`answer-${peerId}`);
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.delete(peerId);
            return next;
          });
          setConnectionStatus((prev) => new Map(prev).set(peerId, 'disconnected'));
        });

        peersRef.current.set(peerId, peer);
        peersInitializedRef.current.add(peerId);
        signalQueueRef.current.set(peerId, []);
        setConnectionStatus((prev) => new Map(prev).set(peerId, 'connecting'));
      } catch (error) {
        console.error('Failed to create peer connection:', error);
        peerConnectionStateRef.current.set(peerId, 'failed');
      }
    },
    [localStream, meetingCode]
  );

  // Handle signaling messages

  const handleOffer = useCallback(
    (data: any) => {
      const { from, offer } = data;
      console.log(`Received offer from ${from}`);
      
      // Prevent duplicate offer processing
      const signalKey = `offer-${from}`;
      if (processedSignalsRef.current.has(signalKey)) {
        console.log(`Skipping duplicate offer from ${from}`);
        return;
      }
      processedSignalsRef.current.add(signalKey);
      
      // If peer doesn't exist, create it
      if (!peersRef.current.has(from)) {
        console.log(`Creating peer connection for ${from} (non-initiator)`);
        createPeerConnection(from, false);
      }
      
      // Delay signal processing to ensure peer is ready
      setTimeout(() => {
        const peer = peersRef.current.get(from);
        const state = peerConnectionStateRef.current.get(from);
        
        // Only signal if peer exists, is not destroyed, and hasn't reached connected state
        if (peer && !peer.destroyed && state !== 'connected' && state !== 'failed') {
          try {
            console.log(`Signaling offer from ${from}`);
            peer.signal(offer);
          } catch (e) {
            console.error('Error signaling offer:', e);
          }
        }
      }, 50);
    },
    [createPeerConnection]
  );

  const handleAnswer = useCallback((data: any) => {
    const { from, answer } = data;
    console.log(`Received answer from ${from}`);
    
    // Prevent duplicate answer processing
    const signalKey = `answer-${from}`;
    if (processedSignalsRef.current.has(signalKey)) {
      console.log(`Skipping duplicate answer from ${from}`);
      return;
    }
    processedSignalsRef.current.add(signalKey);
    
    // Delay signal processing to ensure peer is ready
    setTimeout(() => {
      const peer = peersRef.current.get(from);
      const state = peerConnectionStateRef.current.get(from);
      
      // Only signal if peer exists, is not destroyed, and hasn't reached connected state
      if (peer && !peer.destroyed && state !== 'connected' && state !== 'failed') {
        try {
          console.log(`Signaling answer from ${from}`);
          peer.signal(answer);
        } catch (e) {
          console.error('Error signaling answer:', e);
        }
      }
    }, 50);
  }, []);

  const handleIceCandidate = useCallback((data: any) => {
    const { from, candidate } = data;
    
    const state = peerConnectionStateRef.current.get(from);
    if (state === 'failed') return; // Don't process if connection failed
    
    const peer = peersRef.current.get(from);
    if (peer && !peer.destroyed) {
      try {
        peer.signal(candidate);
      } catch (e) {
        console.error('Error signaling ICE candidate:', e);
      }
    }
  }, []);

  // Socket.io initialization and signaling
  useEffect(() => {
    if (!localStream) {
      console.log('Waiting for local stream...');
      return;
    }

    socket.current = getSocket();
    
    // Only connect if not already connected
    if (!socket.current.connected) {
      socket.current.connect();
    }
    
    socket.current.emit('join-room', { code: meetingCode, name: yourName });

    // Setup signaling listeners
    socket.current.on('offer', handleOffer);
    socket.current.on('answer', handleAnswer);
    socket.current.on('ice-candidate', handleIceCandidate);

    socket.current.on('user-joined', (data: any) => {
      console.log(`User joined: ${data.name}`);
      if (data.name !== yourName && !peersRef.current.has(data.name)) {
        // Delay to ensure peer is ready
        setTimeout(() => {
          if (!peersRef.current.has(data.name)) {
            createPeerConnection(data.name, true);
          }
        }, 300);
      }
    });

    socket.current.on('meeting-event', (data: any) => {
      if (data.event === 'chat') {
        setMessages((prev) => [
          ...prev,
          { user: data.payload.user, text: data.payload.text, time: new Date(data.payload.time) },
        ]);
      } else if (data.event === 'screen-share-start') {
        setMessages((prev) => [
          ...prev,
          { user: 'System', text: `${data.payload.user} started screen sharing`, time: new Date() },
        ]);
        setActiveSpeaker(data.payload.user);
      } else if (data.event === 'screen-share-stop') {
        setMessages((prev) => [
          ...prev,
          { user: 'System', text: `${data.payload.user} stopped screen sharing`, time: new Date() },
        ]);
        if (activeSpeaker === data.payload.user) {
          setActiveSpeaker(null);
        }
      } else if (data.event === 'hand-raised') {
        setMessages((prev) => [
          ...prev,
          { user: 'System', text: `${data.payload.user} ${data.payload.raised ? 'raised' : 'lowered'} hand`, time: new Date() },
        ]);
      }
    });

    // Create peer connections for existing participants with delay
    const timer = setTimeout(() => {
      participants.forEach((p) => {
        if (p.name !== yourName && !peersRef.current.has(p.name)) {
          console.log(`Creating peer connection for existing participant: ${p.name}`);
          createPeerConnection(p.name, true);
        }
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      socket.current?.emit('leave-room', { code: meetingCode, name: yourName });
      peersRef.current.forEach((peer) => {
        try {
          peer.destroy();
        } catch (e) {
          console.error('Error destroying peer:', e);
        }
      });
      peersRef.current.clear();
      signalQueueRef.current.clear();
      peersInitializedRef.current.clear();
      peerConnectionStateRef.current.clear();
      processedSignalsRef.current.clear();
      socket.current?.disconnect();
    };
  }, [meetingCode, yourName, participants, localStream, createPeerConnection, handleOffer, handleAnswer, handleIceCandidate]);

  // Send chat message
  const handleSendMessage = () => {
    if (chatInput.trim()) {
      const message = { user: yourName, text: chatInput, time: new Date() };
      setMessages((prev) => [...prev, message]);

      try {
        socket.current?.emit('meeting-event', {
          code: meetingCode,
          event: 'chat',
          payload: { user: yourName, text: chatInput, time: new Date().toISOString() },
        });
      } catch (e) {
        console.error('Chat send failed:', e);
      }
      setChatInput('');
    }
  };

  // Screen sharing handler
  const handleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      screenStream?.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
      
      // Notify others
      socket.current?.emit('meeting-event', {
        code: meetingCode,
        event: 'screen-share-stop',
        payload: { user: yourName },
      });
    } else {
      // Start screen sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always' as any,
          } as any,
          audio: false,
        });

        setScreenStream(stream);
        setIsScreenSharing(true);

        // Notify others
        socket.current?.emit('meeting-event', {
          code: meetingCode,
          event: 'screen-share-start',
          payload: { user: yourName },
        });

        // Handle screen share stop
        stream.getTracks()[0].addEventListener('ended', () => {
          setScreenStream(null);
          setIsScreenSharing(false);
          socket.current?.emit('meeting-event', {
            code: meetingCode,
            event: 'screen-share-stop',
            payload: { user: yourName },
          });
        });
      } catch (error) {
        console.error('Failed to share screen:', error);
        alert('Failed to share screen. Please try again.');
      }
    }
  };

  // Raise hand handler
  const handleRaiseHand = () => {
    setRaisedHand(!raisedHand);
    socket.current?.emit('meeting-event', {
      code: meetingCode,
      event: 'hand-raised',
      payload: { user: yourName, raised: !raisedHand },
    });
  };

  // Get remote participants list (ensure all connected peers are shown)
  const remoteParticipants = Array.from(remoteStreams.entries()).map(([name, stream]) => {
    const participant = participants.find((p) => p.name === name);
    return {
      id: participant?.id || name,
      name,
      stream,
    };
  });

  return (
    <div className="fixed inset-0 bg-[#1F1F1F] flex overflow-hidden z-50">
      {/* Main Video Grid */}
      <div className="flex-1 flex flex-col">
        {/* Top Status Bar */}
        <div className="bg-[#1F1F1F]/80 border-b border-[#4CAF50]/20 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {networkQuality === 'good' ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : networkQuality === 'fair' ? (
                <Wifi className="w-4 h-4 text-yellow-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-white text-xs">{participants.length} participants</span>
            </div>
            {isScreenSharing && (
              <div className="flex items-center gap-1 bg-[#4CAF50]/20 px-2 py-1 rounded text-xs text-[#4CAF50]">
                <Share2 className="w-3 h-3" /> Sharing
              </div>
            )}
            {speakerMode && (
              <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-1 rounded text-xs text-purple-400">
                <Radio className="w-3 h-3" /> Speaker Mode
              </div>
            )}
          </div>
          <div className="text-white text-xs">{meetingTitle}</div>
        </div>

        {/* Video Grid Container */}
        <div className="flex-1 bg-black overflow-auto p-3">
          {speakerMode ? (
            // Speaker Mode Layout - Large speaker, small thumbnails
            <div className="flex flex-col h-full gap-3">
              {/* Main Speaker Area */}
              <div className="flex-1 bg-black rounded-lg overflow-hidden border border-[#4CAF50]/30">
                {activeSpeaker ? (
                  <motion.div
                    key={activeSpeaker}
                    className="relative w-full h-full bg-black"
                    layoutId="speaker"
                  >
                    {remoteStreams.get(activeSpeaker) ? (
                      <RemoteVideoComponent stream={remoteStreams.get(activeSpeaker)!} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#4CAF50]/10 to-[#4CAF50]/5">
                        <div className="text-center">
                          <div className="text-6xl mb-2">🎙️</div>
                          <p className="text-white font-bold">{activeSpeaker}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Thumbnails at bottom */}
              <div className="flex gap-2 h-24 overflow-x-auto pb-2">
                {/* Local Video Thumbnail */}
                <motion.div className="shrink-0 w-32 bg-black rounded-lg overflow-hidden border border-[#4CAF50]/30 relative cursor-pointer" onClick={() => setActiveSpeaker(null)}>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 left-1 text-xs text-white bg-black/70 px-2 py-1 rounded">
                    {yourName}
                  </div>
                </motion.div>

                {/* Remote Video Thumbnails */}
                {remoteParticipants.map((p) => (
                  <motion.div
                    key={p.id}
                    className="shrink-0 w-32 bg-black rounded-lg overflow-hidden border border-[#4CAF50]/30 cursor-pointer hover:border-[#4CAF50] transition-all relative"
                    onClick={() => setActiveSpeaker(p.name)}
                    whileHover={{ scale: 1.05 }}
                  >
                    {p.stream ? (
                      <RemoteVideoComponent stream={p.stream} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#4CAF50]/10 to-[#4CAF50]/5">
                        <span className="text-xs text-white/60">{p.name}</span>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 text-xs text-white bg-black/70 px-2 py-1 rounded">
                      {p.name}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            // Grid Mode Layout
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-max">
              {/* Local Video */}
              <motion.div
                className="relative bg-black rounded-lg overflow-hidden aspect-video border border-[#4CAF50]/30 group hover:border-[#4CAF50] transition-all"
                whileHover={{ borderColor: '#4CAF50' }}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!isCameraOn && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <VideoOff className="w-16 h-16 text-white/40" />
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/70 px-3 py-1 rounded-full">
                  <div className={`w-2 h-2 rounded-full ${isMicOn ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-white text-sm font-bold">{yourName} (You)</span>
                </div>
              </motion.div>

              {/* Remote Videos */}
              {remoteParticipants.map((p) => (
                <motion.div
                  key={p.id}
                  className="relative bg-black rounded-lg overflow-hidden aspect-video border border-[#4CAF50]/30 group hover:border-[#4CAF50] transition-all cursor-pointer"
                  whileHover={{ borderColor: '#4CAF50' }}
                  onClick={() => setActiveSpeaker(p.name)}
                >
                  {p.stream ? (
                    <RemoteVideoComponent stream={p.stream} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#4CAF50]/10 to-[#4CAF50]/5">
                      <div className="text-center">
                        <div className="text-5xl mb-2 animate-pulse">📹</div>
                        <p className="text-white/60 text-sm font-medium">{p.name}</p>
                        <p className="text-white/40 text-xs mt-1">
                          {connectionStatus.get(p.id) === 'connecting' && 'Connecting...'}
                          {connectionStatus.get(p.id) === 'connected' && 'Connected'}
                          {connectionStatus.get(p.id) === 'error' && 'Connection Error'}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1 rounded-full">
                    <span className="text-white text-sm font-bold">{p.name}</span>
                  </div>
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Control Bar */}
        <div className="bg-linear-to-t from-[#1F1F1F] to-[#1F1F1F]/90 border-t border-[#4CAF50]/20 px-6 py-4 flex items-center justify-center gap-3 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-3 rounded-full transition-all ${
              isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/80 hover:bg-red-600 text-white'
            }`}
            title={isMicOn ? 'Mute' : 'Unmute'}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCameraOn(!isCameraOn)}
            className={`p-3 rounded-full transition-all ${
              isCameraOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/80 hover:bg-red-600 text-white'
            }`}
            title={isCameraOn ? 'Stop Video' : 'Start Video'}
          >
            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleScreenShare}
            className={`p-3 rounded-full transition-all ${
              isScreenSharing ? 'bg-[#4CAF50] text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          >
            {isScreenSharing ? <X className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRaiseHand}
            className={`p-3 rounded-full transition-all ${
              raisedHand ? 'bg-yellow-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Raise Hand"
          >
            <Hand className={`w-5 h-5 ${raisedHand ? 'animate-bounce' : ''}`} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSpeakerMode(!speakerMode)}
            className={`p-3 rounded-full transition-all ${
              speakerMode ? 'bg-purple-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={speakerMode ? 'Disable Speaker Mode' : 'Enable Speaker Mode'}
          >
            <Radio className={`w-5 h-5 ${speakerMode ? 'animate-pulse' : ''}`} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full transition-all ${
              showChat ? 'bg-[#4CAF50] text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Chat"
          >
            <MessageCircle className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowParticipants(!showParticipants)}
            className={`p-3 rounded-full transition-all relative ${
              showParticipants ? 'bg-[#4CAF50] text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Participants"
          >
            <Users className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {participants.length}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onHangUp}
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all ml-auto"
            title="End Call"
          >
            <Phone className="w-5 h-5 rotate-135" />
          </motion.button>
        </div>
      </div>

      {/* Chat Sidebar */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            className="w-80 bg-[#2a2a2a] border-l border-[#4CAF50]/20 flex flex-col"
          >
            <div className="p-4 border-b border-[#4CAF50]/20">
              <h3 className="text-white font-bold">Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm ${
                    msg.user === 'System'
                      ? 'text-gray-400 italic text-center'
                      : msg.user === yourName
                      ? 'text-[#4CAF50]'
                      : 'text-white'
                  }`}
                >
                  <span className="font-bold">{msg.user}:</span> {msg.text}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[#4CAF50]/20 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Message..."
                className="flex-1 bg-[#1F1F1F] text-white rounded px-3 py-2 text-sm outline-none focus:border focus:border-[#4CAF50]"
              />
              <button
                onClick={handleSendMessage}
                className="bg-[#4CAF50] text-white rounded px-3 py-2 text-sm font-bold hover:bg-[#45a049]"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participants Sidebar */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            className="w-80 bg-[#2a2a2a] border-l border-[#4CAF50]/20 flex flex-col"
          >
            <div className="p-4 border-b border-[#4CAF50]/20">
              <h3 className="text-white font-bold">{meetingTitle}</h3>
              <p className="text-[#4CAF50] text-xs mt-1">Code: {meetingCode}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {participants.map((p) => (
                <div key={p.id} className="text-white text-sm p-2 bg-[#1F1F1F]/50 rounded flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>{p.name}</span>
                  </div>
                  {p.name === createdBy && <span className="text-xs bg-[#4CAF50]/30 px-2 py-1 rounded">Host</span>}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[#4CAF50]/20 space-y-2">
              <button
                onClick={onCopyCode}
                className="w-full bg-[#4CAF50] text-white py-2 rounded text-sm font-bold hover:bg-[#45a049] flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy Code
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Remote Video Component
function RemoteVideoComponent({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />;
}
