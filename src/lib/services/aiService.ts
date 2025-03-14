// src/lib/services/aiService.ts
import type { ContentPrompt, ContentSuggestion, UserAIPreferences } from '$lib/types/AIContent';
// Update environment variable name to match your actual env var
// Make sure you've defined this in your .env file
import { VITE_CLAUDE_API_KEY } from '$env/static/private'; // Adjust this to match your actual env var name

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Generate content suggestions using Claude API
 */
export async function generateContentSuggestions(
    prompt: ContentPrompt,
    count: number = 3
): Promise<ContentSuggestion[]> {
    try {
        // Create a structured prompt for Claude
        const systemPrompt = createSystemPrompt(prompt, count);

        // Call Claude API
        const response = await fetch(CLAUDE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': VITE_CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1000,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: createUserPrompt(prompt)
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();

        // Parse the response to extract suggestions
        return parseClaudeResponse(data.content[0].text, prompt.platform);
    } catch (error) {
        console.error('Error generating content suggestions:', error);
        throw error;
    }
}

/**
 * Create a system prompt for Claude API
 */
function createSystemPrompt(prompt: ContentPrompt, count: number): string {
    return `You are an expert social media content creator specializing in creating engaging content for ${prompt.platform}.
Your task is to generate ${count} unique content suggestions based on the user's requirements.

PLATFORM SPECIFICATIONS:
${getPlatformSpecs(prompt.platform)}

CONTENT GUIDELINES:
- Tone: ${prompt.tone || 'professional'}
- Length: ${getContentLengthSpec(prompt.length || 'medium', prompt.platform)}
- Target audience: ${prompt.audience || 'general'}
${prompt.userPreferences ? getUserPreferencesGuide(prompt.userPreferences) : ''}

RESPONSE FORMAT:
Provide exactly ${count} content suggestions in the following JSON format:
\`\`\`json
[
  {
    "title": "Short title for the post",
    "content": "The full post content",
    "tags": ["hashtag1", "hashtag2", "..."],
    "platform": "${prompt.platform}",
    "confidence": 0.95
  },
  {
    "title": "Another title",
    "content": "Another post content",
    "tags": ["hashtag1", "hashtag2", "..."],
    "platform": "${prompt.platform}",
    "confidence": 0.85
  }
]
\`\`\`

Do not include any explanations, just return the JSON.`;
}

/**
 * Create a user prompt for Claude API
 */
function createUserPrompt(prompt: ContentPrompt): string {
    let userPrompt = `Generate ${prompt.platform} content`;

    if (prompt.topic) {
        userPrompt += ` about ${prompt.topic}`;
    }

    if (prompt.keywords && prompt.keywords.length > 0) {
        userPrompt += ` incorporating the following keywords: ${prompt.keywords.join(', ')}`;
    }

    return userPrompt;
}

/**
 * Get platform-specific constraints and best practices
 */
function getPlatformSpecs(platform: string): string {
    switch (platform) {
        case 'twitter':
            return `- Maximum 280 characters
- Hashtags are important but use no more than 3
- Short, punchy content works best
- Questions and calls-to-action drive engagement
- Links should be meaningful but can be mentioned as "link in bio"`;

        case 'facebook':
            return `- Optimal length is 1-2 paragraphs
- Can include links, but don't overdo it
- Engagement questions work well
- Hashtags should be limited (1-2 maximum)
- Personal stories and relatable content perform best`;

        case 'instagram':
            return `- Captions can be longer, but keep them concise and engaging
- Hashtags are very important (suggest 5-10 relevant ones)
- Emoji usage is appropriate and encouraged
- Calls-to-action like "double tap if you agree" or "tag someone who..." work well
- The content should be visual-friendly and mention the image implicitly`;

        case 'linkedin':
            return `- Professional tone
- Industry insights, thought leadership, and valuable information
- Paragraphs should be short for readability
- Minimal hashtag usage (3-5 relevant, industry-specific tags)
- Longer content is acceptable, especially if providing value`;

        default:
            return `- Keep content concise and engaging
- Include appropriate hashtags
- Ensure content is relevant to the platform
- Call-to-actions boost engagement`;
    }
}

/**
 * Get content length specification based on platform and requested length
 */
function getContentLengthSpec(length: string, platform: string): string {
    if (platform === 'twitter') {
        return length === 'long' ? 'Use full 280 character limit' :
            length === 'short' ? 'Keep under 150 characters' :
                'Around 200-240 characters';
    }

    switch (length) {
        case 'short':
            return 'One brief paragraph (2-3 sentences)';
        case 'long':
            return '3-4 paragraphs with detailed information';
        case 'medium':
        default:
            return '1-2 paragraphs with complete thoughts';
    }
}

/**
 * Extract user preferences as guidance
 */
function getUserPreferencesGuide(preferences: UserAIPreferences): string {
    let guide = '';

    if (preferences.preferredTopics && preferences.preferredTopics.length > 0) {
        guide += `- Focus on these topics: ${preferences.preferredTopics.join(', ')}\n`;
    }

    if (preferences.avoidTopics && preferences.avoidTopics.length > 0) {
        guide += `- Avoid these topics: ${preferences.avoidTopics.join(', ')}\n`;
    }

    if (preferences.maxHashtags !== undefined) {
        guide += `- Use no more than ${preferences.maxHashtags} hashtags\n`;
    }

    if (preferences.includeEmojis !== undefined) {
        guide += preferences.includeEmojis
            ? '- Include appropriate emojis in the content\n'
            : '- Avoid using emojis\n';
    }

    if (preferences.contentStyle) {
        guide += `- Content style should be: ${preferences.contentStyle}\n`;
    }

    return guide;
}

/**
 * Parse Claude API response to extract content suggestions
 */
function parseClaudeResponse(responseText: string, platform: string): ContentSuggestion[] {
    try {
        // Extract JSON from the response using regex to find content between ```json and ```
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);

        if (jsonMatch && jsonMatch[1]) {
            // Parse the JSON
            const suggestions = JSON.parse(jsonMatch[1]) as ContentSuggestion[];

            // Ensure all suggestions have the correct platform
            return suggestions.map(suggestion => ({
                ...suggestion,
                platform: platform as 'twitter' | 'facebook' | 'instagram' | 'linkedin'
            }));
        }

        // If no JSON is found in the expected format, try to parse the entire response as JSON
        try {
            return JSON.parse(responseText) as ContentSuggestion[];
        } catch (innerError) {
            console.error('Error parsing direct JSON:', innerError);
            throw new Error('Failed to parse content suggestions from AI response');
        }
    } catch (error) {
        console.error('Error parsing AI response:', error);
        throw new Error('Failed to parse content suggestions from AI response');
    }
}