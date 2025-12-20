# Lumina Learn  
### AI-Powered Personalized Learning Platform using Gemini

Lumina Learn is a web-based, AI-driven personalized learning platform designed to provide adaptive academic support through natural language interaction and multimodal understanding. The system leverages the Gemini API as its core reasoning engine to deliver contextual explanations, summaries, and practice questions tailored to individual learners.

## Features

- Context-aware natural language question answering  
- Multi-turn conversational memory  
- Upload and analysis of notes, PDFs, and images  
- Personalized explanations and summaries  
- AI-generated practice questions for revision  
- Adaptive learning experience based on user interaction  


## Why Gemini API

Lumina Learn relies on the Gemini API as its central intelligence layer, enabling:

- Contextual understanding across multi-turn conversations  
- Multimodal reasoning over text and visual study materials  
- Dynamic generation of personalized educational content  
- Intelligent inference beyond rule-based or static NLP systems  


##  System Architecture

1. **Frontend (Student Dashboard)**  
   - Web-based interface for student interaction  
   - Accepts user queries, file uploads, and learning goals  

2. **Service Layer (Backend)**  
   - Secure API layer handling authentication and requests  
   - Manages session context and user preferences  

3. **AI Layer (Gemini API)**  
   - Processes natural language and multimodal inputs  
   - Performs reasoning and content generation  

4. **Response Layer**  
   - Returns AI-generated explanations and questions  
   - Displays results in a conversational tutor interface  


## Tech Stack

- **Frontend:** HTML, CSS, React (optional)  
- **Backend:** Node.js  
- **AI Engine:** Google Gemini API  
- **Storage:** Firebase 



## Use Cases

- Personalized self-study and revision  
- Concept clarification from uploaded notes  
- Exam preparation with AI-generated practice questions  
- Continuous learning support without human tutors  

## Impact

Lumina Learn transforms traditional self-study into an adaptive, conversational learning experience, making high-quality academic guidance accessible, scalable, and personalized through generative AI.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
