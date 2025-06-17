import { catchError, from, map, of, startWith } from "rxjs";

export async function callGeminiVisionAPI(base64ImageData: string) {
    console.log("Calling Gemini Vision API");
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = "Analyze this image and describe what you see in a single, concise paragraph.";

    const payload = {
        contents: [{
            role: "user",
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: "image/png",
                        data: base64ImageData
                    }
                }
            ]
        }],
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
         const errorBody = await response.text();
         console.error("API Error Response:", errorBody);
         throw new Error(`API request failed with status ${response.status}`);
    }

    return response.json() as Promise<{ message: string }>;
}