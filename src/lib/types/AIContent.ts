// src/lib/types/AIContent.ts
export interface ContentSuggestion {
    title: string;
    content: string;
    tags?: string[];
    platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin';
    confidence: number; // 0-1 score for how confident the AI is about this suggestion
}

export interface ContentPrompt {
    topic?: string;
    keywords?: string[];
    tone?: 'professional' | 'casual' | 'friendly' | 'humorous' | 'authoritative';
    length?: 'short' | 'medium' | 'long';
    platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin';
    audience?: string;
    userPreferences?: UserAIPreferences;
}

export interface UserAIPreferences {
    preferredTopics?: string[];
    avoidTopics?: string[];
    maxHashtags?: number;
    includeEmojis?: boolean;
    contentStyle?: string;
}

// src/lib/services/aiService.ts
import type { ContentPrompt, ContentSuggestion, UserAIPreferences } from '$lib/types/AIContent';
import { CLAUDE_API_KEY } from '$env/static/private';

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
                'x-api-key': CLAUDE_API_KEY,
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

// src/lib/stores/aiStore.ts
import { writable } from 'svelte/store';
import type { ContentPrompt, ContentSuggestion } from '$lib/types/AIContent';
import { generateContentSuggestions } from '$lib/services/aiService';

interface AIStoreState {
    suggestions: ContentSuggestion[];
    isLoading: boolean;
    error: string | null;
}

function createAIStore() {
    const { subscribe, update, set } = writable<AIStoreState>({
        suggestions: [],
        isLoading: false,
        error: null
    });

    return {
        subscribe,

        generateSuggestions: async (prompt: ContentPrompt, count: number = 3) => {
            update(state => ({ ...state, isLoading: true, error: null }));

            try {
                const suggestions = await generateContentSuggestions(prompt, count);
                update(state => ({ ...state, suggestions, isLoading: false }));
                return suggestions;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                update(state => ({ ...state, isLoading: false, error: errorMessage }));
                return [];
            }
        },

        clearSuggestions: () => {
            update(state => ({ ...state, suggestions: [] }));
        },

        reset: () => {
            set({ suggestions: [], isLoading: false, error: null });
        }
    };
}

export const aiStore = createAIStore();

// src/lib/components/ai/ContentSuggestionPanel.svelte
<script lang="ts" >
    import { createEventDispatcher } from 'svelte';
import { aiStore } from '$lib/stores/aiStore';
import Button from '$lib/components/common/Button.svelte';
import type { ContentPrompt, ContentSuggestion } from '$lib/types/AIContent';

export let platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin' = 'twitter';
export let initialTopic: string = '';

const dispatch = createEventDispatcher<{
    select: ContentSuggestion;
}>();

// Store state
$: suggestions = $aiStore.suggestions;
$: isLoading = $aiStore.isLoading;
$: error = $aiStore.error;

// Form state
let topic = initialTopic;
let keywords = '';
let tone: 'professional' | 'casual' | 'friendly' | 'humorous' | 'authoritative' = 'professional';
let length: 'short' | 'medium' | 'long' = 'medium';

// Create the prompt object
function createPrompt(): ContentPrompt {
    return {
        topic: topic || undefined,
        keywords: keywords ? keywords.split(',').map(k => k.trim()) : undefined,
        tone,
        length,
        platform,
        // Add more customization options as needed
    };
}

// Generate suggestions
async function handleGenerateSuggestions() {
    const prompt = createPrompt();
    await aiStore.generateSuggestions(prompt, 3);
}

// Select a suggestion
function handleSelectSuggestion(suggestion: ContentSuggestion) {
    dispatch('select', suggestion);
}

// Clear suggestions
function handleClearSuggestions() {
    aiStore.clearSuggestions();
}
</script>

    < div class="bg-white rounded-lg shadow-md p-4" >
        <h2 class="text-lg font-semibold mb-4" > AI Content Suggestions </h2>

            < !--Input Form-- >
                <div class="mb-6 space-y-4" >
                    <div>
                    <label for= "topic" class= "block text-sm font-medium text-gray-700 mb-1" > Topic </label>
                        < input 
          type = "text" 
          id = "topic"
bind: value = { topic }
placeholder = "Enter a topic"
class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    />
    </div>

    < div >
    <label for= "keywords" class= "block text-sm font-medium text-gray-700 mb-1" > Keywords(comma separated) </label>
        < input 
          type = "text" 
          id = "keywords"
bind: value = { keywords }
placeholder = "product, launch, announcement"
class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    />
    </div>

    < div class="grid grid-cols-2 gap-4" >
        <div>
        <label for= "tone" class= "block text-sm font-medium text-gray-700 mb-1" > Tone </label>
            < select 
            id = "tone" 
            bind: value = { tone }
class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    >
    <option value="professional" > Professional </option>
        < option value = "casual" > Casual </option>
            < option value = "friendly" > Friendly </option>
                < option value = "humorous" > Humorous </option>
                    < option value = "authoritative" > Authoritative </option>
                        </select>
                        </div>

                        < div >
                        <label for= "length" class= "block text-sm font-medium text-gray-700 mb-1" > Length </label>
                            < select 
            id = "length" 
            bind: value = { length }
class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    >
    <option value="short" > Short </option>
        < option value = "medium" > Medium </option>
            < option value = "long" > Long </option>
                </select>
                </div>
                </div>

                < div class="flex justify-end" >
                    <Button 
          on: click = { handleGenerateSuggestions }
variant = "primary"
disabled = { isLoading }
    >
    { isLoading? 'Generating...': 'Generate Suggestions' }
    </Button>
    </div>
    </div>

    < !--Suggestions Display-- >
        { #if suggestions.length > 0 }
        < div class="mt-4" >
            <div class="flex justify-between items-center mb-2" >
                <h3 class="text-md font-medium" > Suggestions </h3>
                    < button
class="text-sm text-gray-500 hover:text-gray-700"
on: click = { handleClearSuggestions }
    >
    Clear all
        </button>
        </div>

        < div class="space-y-4" >
            { #each suggestions as suggestion, i }
            < div class="bg-gray-50 p-3 rounded-md border border-gray-200 hover:border-blue-300 transition" >
                <div class="flex justify-between items-start mb-1" >
                    <h4 class="font-medium" > { suggestion.title } </h4>
                        < span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full" >
                            {(suggestion.confidence * 100).toFixed(0)}% match
                                </span>
                                </div>

                                < p class="text-sm text-gray-700 mb-2" > { suggestion.content } </p>

{ #if suggestion.tags && suggestion.tags.length > 0 }
<div class="flex flex-wrap gap-1 mb-2" >
    { #each suggestion.tags as tag }
    < span class="text-xs bg-gray-100 rounded-full px-2 py-0.5" >#{ tag } </span>
{/each }
</div>
{/if }

<div class="flex justify-end" >
    <Button 
                  on: click = {() => handleSelectSuggestion(suggestion)}
variant = "outline"
size = "sm"
    >
    Use This
        </Button>
        </div>
        </div>
{/each }
</div>
    </div>
{/if }

<!--Error Display-- >
    { #if error }
    < div class="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-md" >
        <p class="text-sm" > { error } </p>
            </div>
{/if }
</div>

    // src/routes/create/+page.svelte
    < script lang = "ts" >
    import { onMount } from 'svelte';
import { toastStore } from '$lib/stores/toastStore';
import { postStore } from '$lib/stores/postStore';
import { authStore } from '$lib/stores/authStore';
import ContentSuggestionPanel from '$lib/components/ai/ContentSuggestionPanel.svelte';
import type { ContentSuggestion } from '$lib/types/AIContent';
import type { Post } from '$lib/types/Post';
import Button from '$lib/components/common/Button.svelte';

let title: string = '';
let content: string = '';
let platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin' = 'twitter';
let scheduledTime: string = '';
let tags: string = '';
let isSubmitting: boolean = false;

// Set default scheduled time to now + 1 hour
onMount(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    date.setMinutes(0);
    date.setSeconds(0);
    scheduledTime = date.toISOString().slice(0, 16); // Format: "YYYY-MM-DDThh:mm"
});

// Handle suggestion selection
function handleSuggestionSelected(event: CustomEvent<ContentSuggestion>) {
    const suggestion = event.detail;

    title = suggestion.title;
    content = suggestion.content;
    platform = suggestion.platform;

    if (suggestion.tags && suggestion.tags.length > 0) {
        tags = suggestion.tags.join(', ');
    }

    // Scroll to form
    document.getElementById('post-form')?.scrollIntoView({ behavior: 'smooth' });

    toastStore.success('Content suggestion applied!');
}

// Create new post
async function handleSubmit() {
    if (!$authStore.user) {
        toastStore.error('You must be logged in to create posts');
        return;
    }

    if (!title || !content || !scheduledTime) {
        toastStore.error('Please fill in all required fields');
        return;
    }

    isSubmitting = true;

    try {
        const newPost: Omit<Post, 'id'> = {
            userId: $authStore.user.uid,
            title,
            content,
            scheduledTime: new Date(scheduledTime).toISOString(),
            platform,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            status: 'scheduled'
        };

        await postStore.addPost(newPost);

        // Reset form
        title = '';
        content = '';
        tags = '';

        // Update scheduled time to now + 1 hour
        const date = new Date();
        date.setHours(date.getHours() + 1);
        date.setMinutes(0);
        date.setSeconds(0);
        scheduledTime = date.toISOString().slice(0, 16);

        toastStore.success('Post scheduled successfully!');
    } catch (error) {
        console.error('Error creating post:', error);
        toastStore.error('Failed to schedule post. Please try again.');
    } finally {
        isSubmitting = false;
    }
}

// Calculate character count for Twitter
$: characterCount = content.length;
$: isOverCharacterLimit = platform === 'twitter' && characterCount > 280;

// Get remaining characters for Twitter
$: remainingCharacters = platform === 'twitter' ? 280 - characterCount : null;
</script>

    < div class="max-w-4xl mx-auto" >
        <h1 class="text-2xl font-bold mb-6" > Create New Post </h1>

            < div class="grid grid-cols-1 lg:grid-cols-3 gap-6" >
                <!--Post Creation Form-- >
                    <div class="lg:col-span-2" >
                        <div id="post-form" class="bg-white rounded-lg shadow-md p-6" >
                            <h2 class="text-lg font-semibold mb-4" > Post Details </h2>

                                < form on: submit | preventDefault={ handleSubmit } class="space-y-4" >
                                    <div>
                                    <label for= "title" class= "block text-sm font-medium text-gray-700 mb-1" > Post Title </label>
                                        < input 
                type = "text"
id = "title"
bind: value = { title }
placeholder = "Enter a title for your post"
class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
required
    />
    </div>

    < div >
    <label for= "platform" class= "block text-sm font-medium text-gray-700 mb-1" > Platform </label>
        < select 
                id = "platform" 
                bind: value = { platform }
class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    >
    <option value="twitter" > Twitter </option>
        < option value = "facebook" > Facebook </option>
            < option value = "instagram" > Instagram </option>
                < option value = "linkedin" > LinkedIn </option>
                    </select>
                    </div>

                    < div >
                    <label for= "content" class= "block text-sm font-medium text-gray-700 mb-1" >
                        Content
                { #if platform === 'twitter' }
    < span class="text-xs text-gray-500 ml-1" >
        ({ remainingCharacters } characters remaining)
</span>
{/if }
</label>
    < textarea
id = "content"
bind: value = { content }
placeholder = "Write your post content here"
rows = "6"
class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 {isOverCharacterLimit ? 'border-red-500' : ''}"
required
    > </textarea>
{ #if isOverCharacterLimit }
<p class="text-xs text-red-500 mt-1" >
    Character limit exceeded by { characterCount - 280 } characters
        </p>
{/if }
</div>

    < div >
    <label for= "scheduled-time" class= "block text-sm font-medium text-gray-700 mb-1" > Scheduled Time </label>
        < input 
                type = "datetime-local"
id = "scheduled-time"
bind: value = { scheduledTime }
class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
required
    />
    </div>

    < div >
    <label for= "tags" class= "block text-sm font-medium text-gray-700 mb-1" > Tags(comma separated) </label>
        < input 
                type = "text" 
                id = "tags"
bind: value = { tags }
placeholder = "product, launch, announcement"
class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    />
    </div>

    < div class="pt-4" >
        <Button 
                type="submit"
variant = "primary"
disabled = { isSubmitting || isOverCharacterLimit}
class="w-full"
    >
    { isSubmitting? 'Scheduling...': 'Schedule Post' }
    </Button>
    </div>
    </form>
    </div>
    </div>

    < !--AI Suggestions Panel-- >
        <div class="lg:col-span-1" >
            <ContentSuggestionPanel 
          { platform }
initialTopic = ""
on: select = { handleSuggestionSelected }
    />
    </div>
    </div>
    </div>

    // src/routes/calendar/+page.svelte
    // Add the following button to import the AI component in the calendar view

    <script>
// Existing script content

// Add import for the Modal and ContentSuggestionPanel
import Modal from '$lib/components/common/Modal.svelte';
import ContentSuggestionPanel from '$lib/components/ai/ContentSuggestionPanel.svelte';

// Add state variables
let showAISuggestionsModal = false;

// Add function to handle AI content suggestion selection
function handleSuggestionSelected(event) {
    const suggestion = event.detail;

    // Create a new post from the suggestion
    const scheduledTime = selectedDate;
    scheduledTime.setHours(new Date().getHours() + 1);

    const newPost = {
        userId: user.uid,
        title: suggestion.title,
        content: suggestion.content,
        scheduledTime: scheduledTime.toISOString(),
        platform: suggestion.platform,
        tags: suggestion.tags || [],
        status: 'scheduled'
    };

    // Add the post
    postStore.addPost(newPost);

    // Close the modal
    showAISuggestionsModal = false;

    // Show a success toast
    toastStore.success('AI-generated post scheduled!');
}
</script>

    < !--Add the following button to the calendar header-- >
        <div class="flex items-center space-x-2" >
            <!--Existing buttons-- >
                <Button on: click = {() => showAISuggestionsModal = true} variant = "primary" size = "sm" class="ml-2" >
                    <span class="material-icons text-sm mr-1" > auto_awesome </span>
      AI Suggest
    </Button>
    </div>

    < !--Add the AI Suggestions Modal-- >
        <Modal 
    title="AI Content Suggestions"
bind: open = { showAISuggestionsModal }
on: close = {() => showAISuggestionsModal = false}
size = "lg" >

    <ContentSuggestionPanel 
      platform="twitter"
on: select = { handleSuggestionSelected }
    />
    </Modal>