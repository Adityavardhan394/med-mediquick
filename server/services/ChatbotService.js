const dialogflow = require('@google-cloud/dialogflow');
const { v4: uuidv4 } = require('uuid');
const { Message, ChatSession } = require('../models/Chat');
const { translate } = require('@google-cloud/translate').v2;
const textToSpeech = require('@google-cloud/text-to-speech');
const speechToText = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');
const util = require('util');

class ChatbotService {
  constructor() {
    this.projectId = process.env.DIALOGFLOW_PROJECT_ID;
    this.sessionClient = new dialogflow.SessionsClient();
    this.translateClient = new translate();
    this.ttsClient = new textToSpeech.TextToSpeechClient();
    this.sttClient = new speechToText.SpeechClient();
  }

  async processMessage(userId, message, language = 'en', isVoice = false) {
    try {
      // Get or create chat session
      let session = await ChatSession.findOne({
        userId,
        status: 'ACTIVE'
      });

      if (!session) {
        session = await ChatSession.create({
          userId,
          sessionId: uuidv4(),
          context: {
            userPreferences: {
              language,
              voiceEnabled: isVoice
            }
          }
        });
      }

      // Process voice input if needed
      let processedMessage = message;
      let audioUrl = null;

      if (isVoice) {
        const audioResult = await this.processVoiceInput(message);
        processedMessage = audioResult.text;
        audioUrl = audioResult.audioUrl;
      }

      // Translate message to English for Dialogflow if not in English
      if (language !== 'en') {
        const [translation] = await this.translateClient.translate(processedMessage, {
          from: language,
          to: 'en'
        });
        processedMessage = translation;
      }

      // Get response from Dialogflow
      const dialogflowResponse = await this.getDialogflowResponse(
        session.sessionId,
        processedMessage
      );

      // Translate response back to user's language if needed
      let botResponse = dialogflowResponse.fulfillmentText;
      if (language !== 'en') {
        const [translation] = await this.translateClient.translate(botResponse, {
          from: 'en',
          to: language
        });
        botResponse = translation;
      }

      // Generate voice response if voice is enabled
      let botAudioUrl = null;
      if (isVoice) {
        botAudioUrl = await this.generateVoiceResponse(botResponse, language);
      }

      // Save messages to database
      const userMessage = await Message.create({
        userId,
        type: isVoice ? 'VOICE' : 'TEXT',
        content: processedMessage,
        audioUrl,
        sender: 'USER',
        intent: dialogflowResponse.intent.displayName,
        language,
        metadata: dialogflowResponse.parameters
      });

      const botMessage = await Message.create({
        userId,
        type: isVoice ? 'VOICE' : 'TEXT',
        content: botResponse,
        audioUrl: botAudioUrl,
        sender: 'BOT',
        intent: dialogflowResponse.intent.displayName,
        language,
        metadata: dialogflowResponse.parameters
      });

      // Update session
      session.messages.push(userMessage._id, botMessage._id);
      session.context.lastIntent = dialogflowResponse.intent.displayName;
      session.lastActivityAt = new Date();
      await session.save();

      return {
        userMessage,
        botMessage,
        sessionId: session.sessionId
      };
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  async getDialogflowResponse(sessionId, message) {
    const sessionPath = this.sessionClient.projectAgentSessionPath(
      this.projectId,
      sessionId
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
          languageCode: 'en'
        }
      }
    };

    const [response] = await this.sessionClient.detectIntent(request);
    return response.queryResult;
  }

  async processVoiceInput(audioData) {
    try {
      // Convert audio data to proper format
      const audioBytes = Buffer.from(audioData, 'base64');
      
      const request = {
        audio: {
          content: audioBytes
        },
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'en-US'
        }
      };

      const [response] = await this.sttClient.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      // Save audio file
      const audioFileName = `voice_${Date.now()}.wav`;
      const audioPath = path.join(__dirname, '../uploads', audioFileName);
      await fs.promises.writeFile(audioPath, audioBytes);

      return {
        text: transcription,
        audioUrl: `/uploads/${audioFileName}`
      };
    } catch (error) {
      console.error('Error processing voice input:', error);
      throw error;
    }
  }

  async generateVoiceResponse(text, language) {
    try {
      const request = {
        input: { text },
        voice: {
          languageCode: language,
          ssmlGender: 'NEUTRAL'
        },
        audioConfig: { audioEncoding: 'MP3' }
      };

      const [response] = await this.ttsClient.synthesizeSpeech(request);
      
      // Save audio file
      const audioFileName = `response_${Date.now()}.mp3`;
      const audioPath = path.join(__dirname, '../uploads', audioFileName);
      await fs.promises.writeFile(audioPath, response.audioContent);

      return `/uploads/${audioFileName}`;
    } catch (error) {
      console.error('Error generating voice response:', error);
      throw error;
    }
  }

  async getChatHistory(userId, sessionId, page = 1, limit = 20) {
    try {
      const session = await ChatSession.findOne({
        userId,
        sessionId
      }).populate({
        path: 'messages',
        options: {
          sort: { createdAt: -1 },
          skip: (page - 1) * limit,
          limit
        }
      });

      return session ? session.messages : [];
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  async closeChatSession(sessionId) {
    try {
      await ChatSession.findOneAndUpdate(
        { sessionId },
        { status: 'CLOSED' }
      );
    } catch (error) {
      console.error('Error closing chat session:', error);
      throw error;
    }
  }
}

module.exports = new ChatbotService(); 