# 🎮 Asylum Interactive Story Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **🚀 Next-Generation Interactive Storytelling Platform** • Professional-grade visual story editor with AI content generation - Demonstrating cutting-edge full-stack development with GenAI integration

A sophisticated web application combining an immersive story reader with a visual node-based editor enhanced by **AI-powered content generation**. Built with modern React/Next.js technologies, strict TypeScript, and seamless OpenAI integration.

---

## ✨ **Feature Highlights**

### 🤖 **AI-Powered Story Creation** *(New)*

- **🧠 Intelligent Content Generation**: OpenAI GPT-4 integration for creating compelling narrative content
- **⚡ Bulk Story Generator**: Generate complete interactive stories (8-30 nodes) with intelligent branching
- **🎯 Contextual AI**: Smart content adaptation based on node type (start/story/end) and narrative tone
- **📊 Multi-Stage Progress**: Real-time generation progress with detailed status updates (30-60s process)
- **🎨 Creative Control**: Genre selection, tone adjustment, complexity levels, and thematic guidance
- **🔄 Iterative Refinement**: Regenerate content with different parameters until perfect

### 📖 **Interactive Story Reader**

- **🎬 Smooth Navigation**: Seamless scene transitions with Framer Motion animations
- **💾 Advanced Save System**: Persistent localStorage with progress tracking and completion metrics
- **📱 Responsive Design**: Optimized experience across mobile, tablet, and desktop devices
- **🎮 Immersive UX**: Intuitive choice-driven gameplay with visual feedback

### 🎨 **Professional Visual Story Editor**

- **🌐 Node-Based Interface**: Powerful React Flow integration for visual story architecture
- **🎯 Specialized Node Types**: Custom-designed Start, Story, and End nodes with intelligent styling
- **🔗 Smart Connection System**: Visual choice linking with automatic validation and conflict detection
- **📝 Rich Content Editor**: Real-time HTML preview with markdown support and content validation
- **🗂️ Advanced Project Management**: Auto-save, intelligent naming, version control, and cloud-ready architecture
- **📤 Multi-Format Export**: Professional exports to Asylum JSON, Generic JSON, and Twine (Twee) formats
- **🧪 Integrated Testing**: One-click story testing with temporary deployment and automatic cleanup

### 🔧 **Enterprise-Grade Technical Architecture**

- **⚡ Strict TypeScript**: 100% type safety and comprehensive interface definitions
- **🚀 Optimized Performance**: React.memo, optimized hooks, and intelligent re-rendering strategies
- **📦 Lazy Loading**: Dynamic imports for heavy components with loading states
- **🛡️ Robust Error Handling**: Comprehensive Error Boundaries with graceful fallbacks
- **🏗️ Modular Design**: Clear separation of concerns with scalable architecture patterns

---

## 🤖 **AI Integration Deep Dive**

### **OpenAI GPT-4 Integration**

```typescript
// Professional API implementation with error handling
const generateStoryContent = async (params: GenerationParams) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Expert interactive fiction writer and game designer..."
      },
      { role: "user", content: createPrompt(params) }
    ],
    max_tokens: Math.ceil(params.length * 1.5),
    temperature: getTemperatureForTone(params.tone),
    response_format: { type: "json_object" }, // Structured output
  });
};
```

### **Intelligent Story Generation Features**

- **🎭 Genre Intelligence**: Fantasy, Sci-Fi, Horror, Mystery, Romance, Adventure, Thriller
- **🎨 Tone Adaptation**: Neutral, Dark, Humorous with contextual language modeling
- **🏗️ Complexity Management**: Simple (linear), Medium (branching), Complex (multi-ending)
- **📏 Dynamic Length Control**: 100-500 word range with intelligent content scaling
- **🧠 Context Awareness**: Node-type specific prompting for narrative coherence

### **Advanced AI Features**

- **🔄 Multi-Stage Generation**: Analyzing → Crafting → Organizing → Positioning → Finalizing
- **📍 Intelligent Node Positioning**: Automatic layout with 400px horizontal, 250px vertical spacing
- **🔗 Connection Validation**: Ensures all nodes are reachable and story flow is logical
- **💡 Content Optimization**: HTML formatting, paragraph structuring, and narrative flow enhancement

---

## 🚀 **Installation & Development**

### **Prerequisites**

```bash
node --version    # v18.17.0+
npm --version     # v9.0.0+
```

### **Environment Setup**

```bash
# Clone and install
git clone https://github.com/NathanKneT/asylum-interactive-story-nextjs.git
cd asylum-interactive-story-nextjs
npm install

# Environment configuration
cp .env.example .env.local
# Add your OpenAI API key: OPENAI_API_KEY=sk-...

# Development
npm run dev
# → http://localhost:3000 (story reader)
# → http://localhost:3000/editor (AI-powered story editor)

# Production deployment
npm run build && npm run start
```

### **Quick Demo**

1. **Open Editor**: Navigate to `/editor`
2. **Create Project**: Click "New" → Enter project details
3. **AI Generation**: Click "Bulk Generate" → Configure theme, genre, tone
4. **Watch Magic**: 30-60 second AI generation with real-time progress
5. **Intelligent Layout**: Nodes automatically positioned with optimal spacing
6. **Test Story**: One-click testing with temporary deployment

---

## 🏗️ **Professional Architecture**

### **Project Structure**

```
src/
├── app/
│   ├── api/ai/              # AI Generation API Routes
│   │   ├── generate-story/     # Single node content generation
│   │   └── generate-bulk-story/ # Complete story generation
│   ├── editor/              # Visual Editor Application
│   └── layout.tsx           # Root layout with metadata
├── components/
│   ├── editor/              # Professional Editor Components
│   │   ├── AIGenerationModal.tsx      # Single node AI generation
│   │   ├── BulkStoryGeneratorModal.tsx # Complete story generation
│   │   ├── EditorToolbar.tsx           # Professional toolbar
│   │   ├── NodeEditor.tsx              # Rich content editor
│   │   └── StoryNodeComponent.tsx      # Visual node components
│   ├── ClientOnlyGame.tsx   # Main story reader
│   └── StoryViewer.tsx      # Scene display component
├── lib/
│   ├── graphToStoryConverter.ts   # Editor → Game conversion
│   ├── dynamicStoryManager.ts     # Story lifecycle management
│   ├── saveManager.ts             # Persistent storage
│   └── aiService.ts               # OpenAI integration layer
├── hooks/
│   └── useAIService.ts            # AI generation hook
├── stores/                        # Zustand state management
├── types/                         # Comprehensive TypeScript definitions
└── data/                         # Sample story data
```

### **Technology Stack**

- **🎯 Frontend**: React 18 + TypeScript + Next.js 14 App Router
- **🤖 AI Integration**: OpenAI GPT-4 API with structured outputs
- **🗃️ State Management**: Zustand with localStorage persistence
- **🎨 Styling**: Tailwind CSS + custom design system
- **📊 Visual Editor**: React Flow with custom node types
- **✨ Animations**: Framer Motion for smooth transitions
- **🔍 Validation**: Strict TypeScript + ESLint + comprehensive error handling

---

## 📊 **Current Project Status**

### ✅ **Production-Ready Features**

- [x] **🤖 Complete AI Integration**: GPT-4 powered content generation
- [x] **⚡ Bulk Story Generation**: Full interactive stories in 60 seconds
- [x] **🎯 Contextual AI**: Smart content based on node type and narrative context
- [x] **📍 Intelligent Positioning**: Automatic node layout with collision detection
- [x] **💾 Advanced Project Management**: Smart saving, loading, and auto-cleanup
- [x] **🧪 Integrated Testing**: One-click story testing with temporary deployment
- [x] **📤 Professional Export**: Multiple format support with validation
- [x] **🎨 Visual Editor**: Complete node-based story creation interface
- [x] **📖 Story Reader**: Immersive gameplay with save/load system
- [x] **🛡️ Error Handling**: Comprehensive error boundaries and graceful fallbacks
- [x] **📱 Responsive Design**: Mobile-first design with desktop optimization

### 🔨 **Next-Level Enhancements (In Progress)**

- [ ] **🧪 Comprehensive Testing**: Jest + Playwright test suite (90%+ coverage target)
- [ ] **📊 Performance Monitoring**: Real-time metrics and optimization
- [ ] **♿ WCAG Compliance**: Full accessibility audit and improvements
- [ ] **🚀 PWA Features**: Service worker and offline functionality
- [ ] **🎨 Advanced Theming**: Customizable visual themes and branding


## 🚧 **Roadmap Features**

### **📋 Immediate Enhancements (1-2 weeks)**

- [ ] **🧪 Complete Testing Suite**
  - Unit tests for all critical components (>90% coverage)
  - Integration tests for AI generation workflow
  - E2E tests for complete user journeys
  - Performance benchmarking and optimization

- [ ] **🔒 Enterprise Security**
  - API rate limiting and usage monitoring
  - Input sanitization and validation
  - Security headers and CSRF protection
  - OpenAI API key management and rotation

- [ ] **📊 Analytics & Monitoring**
  - Real-time performance metrics (Web Vitals)
  - User interaction analytics
  - AI generation success rates and timing
  - Error tracking and alerting (Sentry integration)

### **🚀 Advanced Features (2-4 weeks)**

- [ ] **👥 Multi-User Architecture**
  - User authentication (NextAuth.js)
  - Project sharing and collaboration
  - Real-time collaborative editing
  - Permission-based access control

- [ ] **🗄️ Database Integration**
  - PostgreSQL with Prisma ORM
  - Story versioning and history
  - User profiles and preferences
  - Performance-optimized queries

- [ ] **☁️ Cloud-Native Features**
  - AWS S3 integration for media storage
  - CDN for global performance
  - Serverless deployment optimization
  - Auto-scaling and load balancing ready

### **🤖 Advanced AI Features (3-6 weeks)**

- [ ] **🧠 Multi-Modal AI**
  - DALL-E integration for scene illustrations
  - Character portrait generation
  - Voice synthesis for narration (OpenAI TTS)
  - Dynamic music generation

- [ ] **📈 Intelligent Analytics**
  - Story engagement prediction
  - A/B testing for narrative choices
  - Player behavior analysis
  - Content optimization recommendations

- [ ] **🌐 Enterprise Integration**
  - API for third-party integrations
  - Webhook system for external services
  - White-label customization
  - Multi-tenant architecture

---

## 🛠️ **Development & Deployment**

### **Available Scripts**

```bash
# Development
npm run dev              # Development server with hot reload
npm run build           # Optimized production build
npm run start           # Production server

# Code Quality
npm run type-check      # Strict TypeScript validation
npm run lint           # ESLint with custom rules
npm run lint:fix       # Automatic code formatting

# Testing (Enhanced)
npm run test           # Jest unit tests
npm run test:e2e       # Playwright E2E tests
npm run test:coverage  # Coverage report
npm run validate       # Complete project validation

# Performance
npm run analyze        # Bundle size analysis
npm run lighthouse     # Performance audit
```

### **Production Deployment**

```bash
# Environment setup
export OPENAI_API_KEY="your-api-key"
export NODE_ENV="production"

# Build and deploy
npm run build
npm run start

# Or deploy to Vercel
vercel --prod
```

---

## 💼 **Professional Contact**

- **👨‍💻 Developer**: [Nathan RIHET](https://github.com/NathanKneT)
- **📧 Email**: nathan.rihet06@gmail.com
- **💼 LinkedIn**: [Connect with me](https://linkedin.com/in/nathan-rihet)
- **🌐 Portfolio**: Coming Soon 
- **📱 Repository**: [GitHub](https://github.com/NathanKneT/asylum-interactive-story-nextjs)

---

## 📄 **License & Usage**

MIT License - See [LICENSE](./LICENSE) for details.

This project is available for technical review and demonstration purposes. Professional collaboration opportunities welcome.

---

<div align="center">

**🎯 Professional Portfolio Project - Job Interview Ready**

[![AI Integration](https://img.shields.io/badge/AI-GPT4_Integrated-green?style=for-the-badge&logo=openai)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?style=for-the-badge&logo=typescript)](#)
[![Production Ready](https://img.shields.io/badge/Production-Ready-success?style=for-the-badge)](#)
[![Enterprise Grade](https://img.shields.io/badge/Enterprise-Grade-purple?style=for-the-badge)](#)

---

**💡 Demonstrating: Full-Stack • AI Integration • Professional UX/UI • Scalable Architecture**

*Ready for technical interviews • Available for immediate collaboration*

</div>