# Meeting & Communication System

## Overview

This is a production-ready **one-to-many video conferencing system** built with:
- **WebRTC** (SimplePeer) for peer-to-peer video/audio
- **Socket.io** for real-time signaling & events
- **Next.js 16** with React 19 for frontend
- **Framer Motion** for smooth animations
- **Tailwind CSS 4** for styling

## Features

### 🎥 **Multi-Participant Video Conferencing**
- Connect unlimited participants in a single meeting
- Mesh network architecture (everyone connects to everyone)
- Automatic peer connection management
- HD video quality (1280x720)

### 🎤 **HD Audio Communication**
- Crystal clear audio with automatic echo cancellation
- Noise suppression enabled by default
- Mute/unmute controls for each participant
- Real-time audio streaming

### 🖥️ **Screen Sharing**
- Share your entire screen with all participants
- Screen share notifications in chat
- Seamless start/stop controls
- Automatic cleanup when sharing ends

### 💬 **Real-Time Chat**
- Send instant messages to all participants
- Chat notifications in the chat panel
- System messages for meetings events
- Message timestamp tracking

### 📊 **Speaker Mode**
- **Grid Mode**: See all participants at once (up to 3x3 grid)
- **Speaker Mode**: Focus on active speaker with thumbnail sidebar
  - Click on any participant thumbnail to switch speaker
  - Main video follows the speaker
  - Smooth transitions

### 🙋 **Hand Raising**
- Raise your hand to request speaking time
- Visual indicator shows who has their hand raised
- System notifications in chat

### 👥 **Participants Panel**
- See list of all connected participants
- Identify the meeting host
- Connection status indicators
- Real-time participant count

### 🔐 **Meeting Management**
- Generate unique meeting codes (6-character alphanumeric)
- Easy code sharing (copy button)
- Host identification
- Secure room-based connections

## Getting Started

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **No environment variables required** - The system works out of the box!

### Running the Application

```bash
npm run dev
```

The meeting system will be available at: `http://localhost:3000/meetings`

## Usage

### Creating a Meeting

1. Navigate to `/meetings`
2. Enter your name
3. Click **"Create Meeting"**
4. You'll get a unique meeting code
5. Share this code with others
6. Once others join, their video will appear automatically

### Joining a Meeting

1. Navigate to `/meetings`
2. Enter your name
3. Enter the meeting code (provided by the host)
4. Click **"Join"**
5. Grant camera/microphone permissions when prompted
6. You'll be connected to all participants

### Control Bar

| Button | Function |
|--------|----------|
| 🎤 | Toggle microphone on/off |
| 📹 | Toggle camera on/off |
| 🖥️ | Share your screen |
| ✋ | Raise/lower your hand |
| 📻 | Toggle speaker mode (focus view) |
| 💬 | Open/close chat panel |
| 👥 | Show/hide participants panel |
| ☎️ | End call and return to lobby |

### Status Indicators

- **Green dot**: Participant is connected
- **Green mic icon**: Your microphone is on
- **Red mic icon**: Your microphone is muted
- **"Connecting..."**: WebRTC connection establishing
- **"Connected"**: Stable connection
- **"Connection Error"**: Network issue

## Technical Architecture

### WebRTC Flow

```
User A                          Socket.io Server                          User B
   |                                   |                                    |
   |--- Generate Offer ------------->|                                    |
   |                                   |--- Forward Offer ------------>|
   |                                   |                                |
   |<----- Answer ------------------|<-- Generate Answer ----------|
   |<-- ICE Candidates -------------|<-- ICE Candidates ----------|
   |
   |========== P2P Connection ========|
   |         (Video & Audio)          |
   |                                   |
```

### Socket.io Events

**Signaling Events:**
- `join-room`: Join a meeting
- `offer`: WebRTC offer
- `answer`: WebRTC answer
- `ice-candidate`: ICE candidate
- `leave-room`: Leave meeting

**Communication Events:**
- `meeting-event`: Generic events (chat, hand raise, screen share)
  - `chat`: Text message
  - `screen-share-start`: Screen sharing started
  - `screen-share-stop`: Screen sharing stopped
  - `hand-raised`: Hand raise/lower

### Data Flow

```
Meeting Page
    ↓
VideoCallInterface Component
    ├→ Local Media Stream
    ├→ Socket.io Connection
    └→ SimplePeer Instances (one per participant)
        ├→ Signal Exchange
        └→ Remote Media Streams
            └→ Display in Video Grid
```

## Component Structure

### **MeetingsPage** (`src/app/meetings/page.tsx`)
- Lobby UI for creating/joining meetings
- Meeting state management
- Socket.io event handling
- Navigation between lobby and meeting

### **VideoCallInterface** (`src/components/VideoCallInterface.tsx`)
- Main video grid rendering
- Audio/video controls
- Chat interface
- Participants list
- Screen sharing
- Speaker mode implementation
- WebRTC peer connection management

### **Socket Handler** (`src/pages/api/socketio.ts`)
- Signaling relay
- Room management
- Event broadcasting

## Configuration

### Video Quality Settings

Edit in `VideoCallInterface.tsx`:
```typescript
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
```

### STUN Servers

Public STUN servers configured:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

For production, add your own TURN servers in `VideoCallInterface.tsx`:
```typescript
config: {
  iceServers: [
    { urls: ['stun:your-stun-server.com'] },
    { 
      urls: ['turn:your-turn-server.com'],
      username: 'user',
      credential: 'pass'
    }
  ],
}
```

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full (15+) |
| Edge | ✅ Full |
| Opera | ✅ Full |

## Troubleshooting

### "No camera/microphone access"
- Check browser permissions
- Try in incognito mode
- Restart browser
- Check if another app is using the camera

### "Users can't see my video"
- Check camera is enabled
- Verify internet connection
- Check firewall settings
- Try a different STUN/TURN server

### "Audio is echoing"
- Echo cancellation is enabled by default
- If still happening, check speaker volume
- Try headphones instead of speaker

### "Connection drops frequently"
- Check your internet connection
- Consider adding TURN servers
- Check browser console for errors
- Verify firewall doesn't block WebRTC

## Performance Optimization

### Bandwidth Usage
- ~1 Mbps per video stream (HD)
- ~100 kbps per audio stream
- Total = ~1.1 Mbps × (participants - 1)

### Recommendations
- Limit to 4-6 participants for best experience
- Use hardware acceleration in browser
- Close other bandwidth-heavy apps
- Use wired connection for stability

## Security Considerations

### Current Implementation
- ✅ Room-based isolation (Socket.io)
- ✅ Peer-to-peer encryption (SRTP built-in WebRTC)
- ✅ No external server recording

### Production Recommendations
- 🔐 Add authentication layer
- 🔐 Validate meeting codes
- 🔐 Log all sessions
- 🔐 Use TLS for Socket.io
- 🔐 Add rate limiting
- 🔐 Implement access controls

## Scaling Considerations

### Current Limitations
- 6-8 participants recommended max
- Mesh topology (not suitable for 100+ users)

### For Large Scale
- Implement SFU (Selective Forwarding Unit)
- Use media servers like Janus, Kurento, or MediaSoup
- Consider CDN for signaling
- Add load balancing

## API Reference

### VideoCallInterface Props

```typescript
interface VideoCallInterfaceProps {
  participants: Participant[];      // All meeting participants
  meetingCode: string;              // Unique meeting identifier
  meetingTitle: string;             // Meeting name
  createdBy: string;                // Host name
  yourName: string;                 // Your display name
  onHangUp: () => void;             // Hangup callback
  onCopyCode: () => void;           // Copy code callback
}
```

### Participant Type

```typescript
interface Participant {
  id: string;                       // Unique participant ID
  name: string;                     // Display name
  joinedAt: Date;                   // Join timestamp
}
```

## Future Enhancements

- [ ] Meeting recording
- [ ] Virtual backgrounds
- [ ] Screen annotation/drawing
- [ ] Breakout rooms
- [ ] Waiting room
- [ ] Meeting scheduling
- [ ] WebRTC statistics dashboard
- [ ] Auto low-light correction
- [ ] Speaker detection
- [ ] Transcription

## Debugging

### Enable Debug Logging

Add to `VideoCallInterface.tsx`:
```typescript
const logDebug = (msg: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[WebRTC] ${msg}`, data);
  }
};
```

### Check WebRTC Stats

In browser DevTools:
```javascript
// List all peer connections
chrome://webrtc-internals
```

## Support & Contribution

For issues or feature requests, check the main project documentation.

## License

Same as main project.
