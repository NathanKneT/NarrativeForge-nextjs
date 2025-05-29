# 🎮 Asylum Interactive Story Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **🏗️ Interactive Storytelling Platform** • A visual story editor with integrated player - Portfolio project showcasing modern full-stack development skills

A sophisticated web application combining an immersive story reader with a visual node-based editor. Built with modern React/Next.js technologies and strict TypeScript.

---

## ✨ **Current Features**

### 📖 **Interactive Story Reader**

- **Smooth navigation** between scenes with Framer Motion animations
- **Save/load system** with persistent localStorage
- **Progress tracking** with visited nodes and completion percentage
- **Responsive interface** adapted for mobile/desktop
- **Robust state management** with Zustand and data validation

### 🎨 **Visual Story Editor**

- **Node-based interface** with React Flow for visual creation
- **Specialized node types**: Start, Scene, End with custom styling
- **Connection system** to link choices to next scenes
- **Content editor** with real-time HTML preview
- **Project management** with auto-save/load functionality
- **Multi-format export**: Asylum JSON, Generic JSON, Twine (Twee)
- **Integrated test mode** to test stories directly from editor

### 🔧 **Technical Architecture**

- **Strict TypeScript** with complete typing and zero `any`
- **Optimized components** with React.memo and optimized hooks
- **Lazy loading** for heavy editor components (React Flow)
- **Error handling** with Error Boundaries
- **Modular structure** with clear separation of concerns

---

## 🚀 **Installation & Development**

### **Prerequisites**

```bash
node --version    # v18.17.0+
npm --version     # v9.0.0+
```

### **Quick Setup**

```bash
# Clone and install
git clone https://github.com/NathanKneT/asylum-interactive-story-nextjs.git
cd asylum-interactive-story-nextjs
npm install

# Development
npm run dev
# → http://localhost:3000 (story reader)
# → http://localhost:3000/editor (story editor)

# Basic validation
npm run type-check    # TypeScript validation
npm run lint         # ESLint
npm run build        # Production build
```

---

## 🏗️ **Project Architecture**

### **Folder Structure**

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (health, metrics)
│   ├── editor/            # Editor page
│   └── layout.tsx         # Root layout with metadata
├── components/            # React Components
│   ├── editor/           # Editor-specific components
│   ├── ClientOnlyGame.tsx # Main story reader (client-only)
│   ├── StoryViewer.tsx   # Scene display component
│   └── ...
├── lib/                  # Business logic
│   ├── graphToStoryConverter.ts  # Editor → game conversion
│   ├── saveManager.ts           # Save management
│   ├── storyLoader.ts          # Story loading
│   └── ...
├── stores/               # Global state (Zustand)
├── types/                # TypeScript definitions
└── data/                # Default story data
```

### **Technology Stack**

- **Frontend**: React 18 + TypeScript + Next.js 14
- **State**: Zustand with localStorage persistence
- **Styling**: Tailwind CSS + custom classes
- **Editor**: React Flow for visual interface
- **Animations**: Framer Motion
- **Validation**: Strict TypeScript + ESLint

---

## 📊 **Current Project Status**

### ✅ **Complete Features**

- [x] Functional story reader with navigation
- [x] Complete save/load system
- [x] Visual editor with React Flow
- [x] Project management (create, edit, export)
- [x] Graph → playable story conversion
- [x] Responsive and accessible interface
- [x] Error handling and loading states
- [x] Integrated test mode from editor
- [x] Strict TypeScript across entire codebase

### 🔨 **In Development / Improvements**

- [ ] **Automated testing**: Jest structure present but tests incomplete
- [ ] **Performance monitoring**: Code present but not fully integrated
- [ ] **WCAG accessibility**: Partially implemented
- [ ] **PWA features**: Service worker and manifest to add
- [ ] **Visual themes**: Advanced theming system

---

## 🚧 **TODO - Complete Roadmap**

### **📋 Phase 1: Solidification (Short term)**

- [ ] **Complete Testing Suite**

  - [ ] Unit tests for all critical components
  - [ ] Integration tests for user flows
  - [ ] E2E tests with Playwright (structure present)
  - [ ] Test coverage >90%

- [ ] **CI/CD Pipeline**

  - [ ] GitHub Actions for automatic validation
  - [ ] Automated tests on PR
  - [ ] Automatic deployment (Vercel/Netlify)
  - [ ] Automated security audit

- [ ] **Performance & Monitoring**
  - [ ] Functional Web Vitals monitoring
  - [ ] Bundle analysis and optimization
  - [ ] Lighthouse audit >90
  - [ ] Error tracking (Sentry)

### **🚀 Phase 2: Backend & Database (Medium term)**

- [ ] **Complete Backend API**

  - [ ] Node.js/Express or Next.js API server
  - [ ] Database (PostgreSQL/MongoDB)
  - [ ] JWT/OAuth authentication
  - [ ] REST/GraphQL API for stories

- [ ] **User Management**

  - [ ] Registration/login system
  - [ ] User profiles
  - [ ] Private/public stories
  - [ ] Sharing and collaboration

- [ ] **Cloud Storage**
  - [ ] Images and media (AWS S3/Cloudinary)
  - [ ] Cloud backup of projects
  - [ ] Multi-device synchronization

### **🤖 Phase 3: Artificial Intelligence (Long term)**

- [ ] **AI Story Generation**

  - [ ] OpenAI GPT integration for content generation
  - [ ] Automatic story graph generation
  - [ ] AI assistant for scenario suggestions
  - [ ] Image generation (DALL-E/Midjourney)

- [ ] **Advanced Features**
  - [ ] AI character generation
  - [ ] Dynamic adaptation based on player
  - [ ] Generated voice narration (TTS)
  - [ ] Automatic multi-language translation

### **🌐 Phase 4: Community Platform (Vision)**

- [ ] **Story Marketplace**

  - [ ] Community story catalog
  - [ ] Rating and comment system
  - [ ] Creator monetization
  - [ ] Discovery and recommendations

- [ ] **Social Features**

  - [ ] Creator profiles
  - [ ] Following and subscriptions
  - [ ] Creation challenges
  - [ ] Forums and community

- [ ] **Analytics & Business**
  - [ ] Analytics dashboard for creators
  - [ ] Story engagement metrics
  - [ ] A/B testing for optimization
  - [ ] Business intelligence

### **🏗️ Phase 5: Enterprise Infrastructure (Vision)**

- [ ] **Scalability**

  - [ ] Microservices architecture
  - [ ] Container orchestration (Kubernetes)
  - [ ] Load balancing and auto-scaling
  - [ ] Global CDN for performance

- [ ] **Advanced DevOps**
  - [ ] Infrastructure as Code (Terraform)
  - [ ] Distributed monitoring (Prometheus/Grafana)
  - [ ] Alerting and incident management
  - [ ] Blue/green deployments

---

## 🎯 **Portfolio Project Goals**

### **Skills Demonstration**

This project aims to demonstrate:

- **Advanced Frontend**: React/Next.js with strict TypeScript
- **Complex State Management**: Zustand with persistence and validation
- **Modern UX/UI**: Intuitive interface with smooth animations
- **Scalable Architecture**: Modular and maintainable code
- **Product Thinking**: Real and useful user features

### **Technologies Mastered**

- **React 18**: Advanced hooks, performance optimizations
- **TypeScript**: Strict typing, complex interfaces
- **Next.js 14**: App Router, API Routes, optimizations
- **State Management**: Zustand with advanced patterns
- **UI Libraries**: React Flow, Framer Motion, Tailwind
- **Testing**: Jest, React Testing Library, Playwright

---

## 🛠️ **Development Guide**

### **Available Scripts**

```bash
# Development
npm run dev              # Development server
npm run build           # Production build
npm run start           # Production server

# Code quality
npm run type-check      # TypeScript validation
npm run lint           # ESLint
npm run lint:fix       # Automatic ESLint fix

# Testing (structure present)
npm run test           # Unit tests
npm run test:e2e       # E2E Playwright tests
npm run test:coverage  # Test coverage

# Validation (in development)
npm run validate       # Complete project validation
```

### **Test Structure (To Complete)**

```bash
src/__tests__/
├── components/        # Component unit tests
├── lib/              # Business logic tests
├── e2e/              # End-to-end tests
└── utils/            # Test utilities
```

---

## 🤝 **Contributing**

### **Code Standards**

- **Strict TypeScript**: No `any`, complete typing
- **ESLint**: Respect Next.js + custom rules
- **Conventional commits**: `feat:`, `fix:`, `docs:`, etc.
- **Documentation**: Comments for complex logic

### **Development Process**

1. Fork + feature branch
2. Development with tests
3. Local validation (`npm run lint && npm run type-check`)
4. PR with detailed description

---

## 📞 **Contact & Resources**

- **Developer**: [Nathan RIHET](https://github.com/NathanKneT)
- **Repository**: [GitHub](https://github.com/NathanKneT/asylum-interactive-story-nextjs)
- **Live Demo**: _To be deployed_
- **Documentation**: README + code comments

---

## 📄 **License**

MIT License - See [LICENSE](./LICENSE) for details.

---

<div align="center">

**🎮 Portfolio project demonstrating modern full-stack development skills**

[![Portfolio](https://img.shields.io/badge/Portfolio-Project-blue?style=for-the-badge)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge)](#)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge)](#)

---

**Actively in development • Contributions welcome • Ambitious roadmap**

</div>
