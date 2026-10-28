import { Router, Response } from 'express';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getVoiceProvider } from '../services/voice/voiceProvider';
import { SUPPORTED_LANGUAGES } from '../config/constants';

const router = Router();
const upload = multer({
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max audio
  storage: multer.memoryStorage(),
});

// GET /api/voice/languages - returns list of supported languages
router.get('/languages', (req, res) => {
  res.json({
    success: true,
    languages: SUPPORTED_LANGUAGES,
  });
});

// POST /api/voice/transcribe - Transcribe uploaded audio file or base64
router.post(
  '/transcribe',
  authenticate,
  upload.single('audio'),
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const languageCode = (req.body.language || user.preferredVoiceLanguage || 'en-IN') as string;
      const voiceProvider = getVoiceProvider();

      let audioBuffer: Buffer;
      let mimeType = 'audio/wav';

      if (req.file) {
        audioBuffer = req.file.buffer;
        mimeType = req.file.mimetype;
      } else if (req.body.audioBase64) {
        const base64Data = req.body.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
        audioBuffer = Buffer.from(base64Data, 'base64');
        mimeType = req.body.mimeType || 'audio/webm';
      } else {
        // If testing without audio file or in mock mode
        audioBuffer = Buffer.from('mock-audio-buffer');
      }

      const result = await voiceProvider.transcribe(audioBuffer, mimeType, languageCode);

      res.json({
        success: true,
        transcript: result.transcript,
        confidence: result.confidence,
        detectedLanguage: result.detectedLanguage,
        provider: result.provider,
        isMock: result.isMock,
        notes: result.notes,
      });
    } catch (error: any) {
      console.error('[VoiceRoute] Transcription failed:', error);
      res.status(500).json({ success: false, message: error.message || 'Transcription failed' });
    }
  }
);

// POST /api/voice/speak - Text-to-speech synthesis
router.post('/speak', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { text, language } = req.body;

    if (!text) {
      res.status(400).json({ success: false, message: 'Text is required for TTS' });
      return;
    }

    const languageCode = language || user.preferredVoiceLanguage || 'en-IN';
    const voiceProvider = getVoiceProvider();

    const result = await voiceProvider.synthesize(text, languageCode);

    res.json({
      success: true,
      audioBase64: result.audioBase64,
      audioUrl: result.audioUrl,
      mimeType: result.mimeType,
      provider: result.provider,
      isMock: result.isMock,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'TTS synthesis failed' });
  }
});

export default router;
