import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the Google Gen AI SDK
// Make sure to set your GEMINI_API_KEY environment variable!
const ai = new GoogleGenAI({});

app.post('/api/generate-quiz', async (req, res) => {
  const { topic, difficulty } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const prompt = `Generate a 5-question multiple choice quiz about "${topic}" at a "${difficulty}" difficulty level. 
  Ensure questions are accurate, highly specific to the nuance of the topic, and have distinct options.`;

  try {
    // Call the Gemini 2.5 Flash model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        // We use Structured Outputs to guarantee the response exactly matches what our frontend expects
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'List of 5 quiz questions',
          items: {
            type: Type.OBJECT,
            properties: {
              q: { type: Type.STRING, description: 'The question text' },
              o: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: 'An array of exactly 4 multiple-choice options' 
              },
              a: { type: Type.INTEGER, description: 'The 0-based array index of the correct answer option' }
            },
            required: ['q', 'o', 'a']
          }
        }
      }
    });

    // Parse and return the structured JSON straight to the user
    const quizData = JSON.parse(response.text);
    res.json(quizData);

  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Failed to generate AI quiz' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Secure AI quiz engine running on http://localhost:${PORT}`));
