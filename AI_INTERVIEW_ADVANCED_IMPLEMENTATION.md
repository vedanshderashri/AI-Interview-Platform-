# AI Interview Advanced Mode - Implementation Guide

## Overview
This implementation adds a comprehensive AI Interview Advanced mode to the MockMate platform. The feature allows candidates to conduct AI-powered interviews with video playback, voice interaction, and intelligent question generation using Google's Gemini API.

## Architecture

### Multi-Step Flow

#### Step 1: Candidate Name
- Simple input form requesting candidate's full name
- Used to personalize the interview experience
- Located at: `CandidateNameStep.tsx`

#### Step 2: Selection Mode
- Two options: Resume Analysis or Manual Domain Selection
- Visual card-based interface matching website design
- Located at: `SelectionModeStep.tsx`

#### Step 3a: Resume Upload (if Resume selected)
- Drag-and-drop file upload interface
- Supports PDF and DOCX formats
- Uses existing `/api/parse-resume` endpoint
- Located at: `ResumeUploadStep.tsx`

#### Step 3b: Domain Selection (if Domains selected)
- Multi-select grid with predefined domain categories
- Supports custom domain input
- Categories: Core Tech, Infrastructure, Psychometrics, Advanced
- Located at: `DomainSelectionStep.tsx`

#### Step 4: Interview Session
- Video playback with AI boy model
- Speech recognition for candidate answers
- Text-to-speech for AI questions
- Real-time conversation history
- Located at: `AIInterviewSession.tsx`

## Components

### CandidateNameStep
```typescript
Props:
  onSubmit: (name: string) => void
```
Simple form component for collecting candidate name with validation.

### SelectionModeStep
```typescript
Props:
  onSelect: (mode: 'resume' | 'domains') => void
```
Visual selection component for choosing between resume or domains mode.

### ResumeUploadStep
```typescript
Props:
  onUpload: (file: File) => void
  isProcessing: boolean
```
Drag-and-drop file uploader with resume parsing integration.

### DomainSelectionStep
```typescript
Props:
  onSubmit: (domains: string[]) => void
```
Multi-select domain picker with custom domain input support.

### AIInterviewSession
Main interview component with:
- Video player for boy-interview.mp4
- Real-time speech recognition
- Question generation via API
- Message history display
- Controls for start/stop listening and submit answers

## API Endpoint: `/api/ai-interview-question`

### Request
```json
{
  "domains": ["React", "System Design"],
  "resumeText": "...",
  "conversationHistory": [
    { "role": "model", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "questionNumber": 1,
  "candidateName": "John Doe"
}
```

### Response
```json
{
  "success": true,
  "question": "Tell me about your experience with React...",
  "questionNumber": 1
}
```

### Features
- Uses Gemini 2.0 Flash API for intelligent question generation
- Considers previous questions/answers for contextual follow-ups
- Fallback to predefined questions if API fails
- Supports resume-based personalization

## Supported Domains

### Core Tech
- React
- Next.js
- TypeScript
- JavaScript
- CSS/Tailwind

### Infrastructure
- Node.js
- System Design
- Databases
- APIs
- DevOps

### Psychometrics
- Communication
- Leadership
- Conflict Resolution
- Teamwork
- Problem Solving

### Advanced
- Machine Learning
- Cloud Architecture
- Security
- Performance

## User Flow

1. User clicks "AI Interview Advanced" button from home page or sidebar
2. Enters their full name
3. Chooses between Resume or Domains mode
4. If Resume: uploads PDF/DOCX file
   - If Domains: selects 1+ domains
5. Interview starts with 5 questions max
6. For each question:
   - AI boy video plays and speaks question
   - Video pauses, ready for user answer
   - User clicks "Start Listening" to record answer
   - Clicks "Submit Answer" when done
   - Next question is generated and cycle repeats
7. After 5 questions or user clicks "End Interview", session ends

## Technical Implementation

### Speech Recognition
- Uses Web Speech API (Chrome, Edge, Safari)
- Continuous mode disabled for cleaner transcript
- Auto-starts after AI finishes speaking
- Interim results displayed as user speaks

### Text-to-Speech
- Uses native `SpeechSynthesisUtterance`
- Triggers video playback during speaking
- Pauses video after speaking completes
- Natural speech rate and pitch

### State Management
- Zustand store for session data
- Conversation history tracked
- Metrics updated in real-time

### UI/UX
- Consistent with existing site design
- Green (#4CAF50) accent color
- Glass-morphism cards with motion animations
- Responsive layout for mobile and desktop
- Real-time feedback (listening indicator, speaking status)

## Installation & Setup

### 1. Environment Variables
Add to `.env.local`:
```
GOOGLE_API_KEY=your_gemini_api_key_here
```

### 2. Video File
- Place `boy-interview.mp4` in `public/` folder
- Video will be served at `/boy-interview.mp4`
- Currently placed at: `public/boy-interview.mp4`

### 3. Resume Parsing
- Uses existing `/api/parse-resume` endpoint
- Requires PDF/DOCX to text conversion

## Usage

### Starting an Interview
1. Navigate to home page
2. Click "AI Interview Advanced" button
3. Follow the multi-step flow

### During Interview
- **Start Listening**: Click to begin speech recognition
- **Stop**: Pause listening without submitting
- **Submit Answer**: Send transcript and get next question
- **End Interview**: Terminate session early

## Fallback Questions

If Gemini API fails, the system falls back to predefined questions from `INTERVIEW_QUESTIONS_BY_DOMAIN` object in the API route. Each domain has 5+ pre-written questions.

## Performance Considerations

1. **Video**: boy-interview.mp4 should be optimized for web (4-10MB recommended)
2. **API Calls**: One Gemini API call per question (~5 calls per interview)
3. **Speech Recognition**: Requires user microphone permission
4. **Browser Compatibility**: Works best in Chrome, Edge, Safari

## Troubleshooting

### Video Not Playing
- Check if file exists at `public/boy-interview.mp4`
- Verify CORS headers if video hosted externally
- Check browser console for playback errors

### Speech Recognition Not Working
- Ensure microphone permissions are granted
- Check browser console for SpeechRecognition API errors
- Web Speech API only works in certain browsers

### Questions Not Generating
- Verify `GOOGLE_API_KEY` is set correctly
- Check API quota and rate limits
- Review API response in network tab
- Fallback questions will be used if API fails

### Resume Parsing Fails
- Verify PDF/DOCX file is not corrupted
- Check `/api/parse-resume` endpoint is working
- Try with different file format

## Future Enhancements

1. **Evaluation Metrics**
   - Real-time confidence scoring
   - Eye contact detection via camera
   - Sentiment analysis of answers

2. **Advanced Features**
   - Multiple AI personalities
   - Live feedback and suggestions
   - Interview replay and analysis
   - Performance benchmarking

3. **Integration**
   - Email results summary
   - LinkedIn profile integration
   - Interview difficulty levels
   - Practice mode with hints

## Files Modified/Created

### New Files
- `/src/app/ai-interview-advanced/page.tsx`
- `/src/components/ai-interview/CandidateNameStep.tsx`
- `/src/components/ai-interview/SelectionModeStep.tsx`
- `/src/components/ai-interview/ResumeUploadStep.tsx`
- `/src/components/ai-interview/DomainSelectionStep.tsx`
- `/src/components/ai-interview/AIInterviewSession.tsx`
- `/src/app/api/ai-interview-question/route.ts`
- `public/boy-interview.mp4`

### Modified Files
- `/src/app/page.tsx` - Added AI Interview Advanced button
- `/src/components/ui/Sidebar.tsx` - Added navigation link

## Dependencies Used

- `@google/generative-ai` - ^0.21.0 (Gemini API client)
- `framer-motion` - ^12.38.0 (Animations)
- `zustand` - ^5.0.12 (State management)
- `next` - 16.2.3 (Framework)
- `react` - 19.2.4 (UI library)
- `lucide-react` - ^1.8.0 (Icons)

## Browser Support

- Chrome 25+
- Edge 79+
- Safari 14.1+
- Firefox 55+
- Mobile browsers (iOS Safari 14.5+, Chrome Android)

## Notes

- Web Speech API may vary by browser and OS
- Speech recognition works best in English but supports other languages
- Microphone permissions required
- HTTPS recommended for production (required for some browsers)
- Video loop enabled for seamless playback
