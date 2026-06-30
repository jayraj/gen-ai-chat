// Initialize Lucide icons on document load
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        window.lucide.createIcons();
    }
});

// Grab DOM elements precisely matching index.html
const themeBtn = document.getElementById('themeBtn');
const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');
const welcomeMessage = document.getElementById('welcomeMessage');
const chatFeed = document.getElementById('chatFeed');
const newChatBtn = document.getElementById('newChatBtn');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const voiceBtn = document.getElementById('voiceBtn');

// 1. Mobile Responsive Sidebar Drawer Trigger
if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}

// 2. Toggle Dark/Light Theme Layout
if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
    });
}

// 3. Clear Chat Session Trigger
if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
        chatFeed.innerHTML = '';
        chatFeed.style.display = 'none';
        if (welcomeMessage) welcomeMessage.style.display = 'block';
    });
}

// Helper to check if Marked library is ready to parse Markdown strings securely
function renderContent(text) {
    if (window.marked && typeof window.marked.parse === 'function') {
        return window.marked.parse(text);
    }
    // Fallback if the CDN engine encounters localized script loading blocks
    return text.replace(/\n/g, '<br>');
}

// 4. Functional Chat Message Handler (Connected to Live Backend with Markdown Processing)
async function handleSendMessage() {
    const text = userInput.value.trim();
    if (!text) return; 

    // Hide welcome message panel and activate interactive display layout
    if (welcomeMessage) welcomeMessage.style.display = 'none';
    if (chatFeed) chatFeed.style.display = 'flex';

    // Append User Message Bubble
    const userBubble = document.createElement('div');
    userBubble.classList.add('msg', 'user');
    userBubble.textContent = text;
    chatFeed.appendChild(userBubble);

    // Clear input box immediately
    userInput.value = '';
    chatFeed.scrollTop = chatFeed.scrollHeight;

    // Create placeholder for Bot response
    const botBubble = document.createElement('div');
    botBubble.classList.add('msg', 'bot');
    botBubble.innerHTML = '<span class="thinking-text">Thinking...</span>';
    chatFeed.appendChild(botBubble);
    chatFeed.scrollTop = chatFeed.scrollHeight;

    try {
        const response = await fetch('https://gen-ai-chat-backend.vercel.app/api/chat', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: text })
        });

        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        const finalReply = data.reply || "No reply field returned from server.";
        
        // Dynamic Markdown transformation step
        botBubble.innerHTML = renderContent(finalReply);
    } catch (error) {
        console.error("Network Error:", error);
        botBubble.textContent = "Error: Could not reach the backend API system.";
    }
    
    chatFeed.scrollTop = chatFeed.scrollHeight;
}

// 5. Bind Input Send Events safely
if (sendBtn) {
    sendBtn.addEventListener('click', handleSendMessage);
}

if (userInput) {
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });
}

// 6. Web Speech Capture Engine Configuration
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition && voiceBtn) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false; 
    recognition.lang = 'en-US';     
    recognition.interimResults = false;

    let isRecording = false;

    voiceBtn.addEventListener('click', () => {
        if (!isRecording) {
            recognition.start();
        } else {
            recognition.stop();
        }
    });

    recognition.onstart = () => {
        isRecording = true;
        voiceBtn.classList.add('recording');
        if (userInput) userInput.placeholder = "Listening attentively...";
    };

    recognition.onend = () => {
        isRecording = false;
        voiceBtn.classList.remove('recording');
        if (userInput) userInput.placeholder = "Type your message here...";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (userInput) {
            userInput.value += (userInput.value ? ' ' : '') + transcript;
            userInput.focus();
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech capturing module experienced an issue: ", event.error);
        isRecording = false;
        voiceBtn.classList.remove('recording');
    };

} else if (voiceBtn) {
    voiceBtn.style.display = 'none';
    console.warn("Web Speech capturing engine not supported within this browser engine.");
}
