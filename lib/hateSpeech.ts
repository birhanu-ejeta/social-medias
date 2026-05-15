// lib/hateSpeech.ts
export interface HateSpeechResult {
  success: boolean;
  data?: {
    is_toxic: boolean;
    toxicity_score: number;
    language: string;
    toxic_categories: string[];
  };
  error?: string;
}

export async function checkHateSpeech(text: string): Promise<HateSpeechResult> {
  // 🔧 FIX: Remove NEXT_PUBLIC_ prefix for server-side
  const API_URL = process.env.HATE_SPEECH_API_URL || 'http://localhost:5000/api';
  const API_KEY = process.env.HATE_SPEECH_API_KEY;

  console.log('🔑 [HATE_SPEECH] API_URL:', API_URL);
  console.log('🔑 [HATE_SPEECH] API_KEY exists:', !!API_KEY);

  if (!API_KEY) {
    console.error("❌ No Hate Speech API Key configured");
    return { success: false, error: "Moderation service not configured" };
  }

  try {
    console.log('📡 [HATE_SPEECH] Calling API:', `${API_URL}/detect`);
    console.log('📝 [HATE_SPEECH] Text:', text);

    const response = await fetch(`${API_URL}/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ text }),
    });

    console.log('📊 [HATE_SPEECH] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [HATE_SPEECH] API Error:', errorData);
      return {
        success: false,
        error: errorData.error || `HTTP error ${response.status}`,
      };
    }

    const result = await response.json();
    console.log('✅ [HATE_SPEECH] API Response:', JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error("❌ [HATE_SPEECH] Connection error:", error);
    return {
      success: false,
      error: "Cannot connect to hate speech detection service",
    };
  }
}