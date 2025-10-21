# 🌌 Aether — Project Overview

**Name:** Aether  
**Type:** Web application (React + Tailwind, packaged to desktop later with Tauri)  
**Goal:** Build a clean, modern, SRD-compliant **Dungeons & Dragons 5e character creator and manager**, with emphasis on usability, offline support, and eventual expansion into reference tools.  

---

## 🎯 Vision
Aether is designed to be the **go-to tool for managing D&D 5e characters**: fast to set up, intuitive to use, and legally compliant by sticking to SRD content. It should feel like a polished productivity app (Notion, Obsidian, etc.) but tailored to tabletop gaming.  

---

## 📐 Scope (MVP)
- Create characters (basic SRD races, classes, backgrounds).  
- View character sheet (stats, HP, abilities, equipment placeholders).  
- Local save/load of characters.  
- Simple, elegant UI powered by Tailwind.  

**Out of Scope (for MVP):**
- Spell management.  
- Campaign or party management.  
- Firebase/cloud sync.  
- PDF export.  

---

## 🗂 Milestones

### **Phase 1 – Foundation** ✅
   - React + Tailwind scaffold
   - Routing structure (React Router)
   - Component architecture & folder structure
   - Character data model (TypeScript interfaces)
   - SRD data structure planning
   - Local persistence setup

### **Phase 1.5 – SRD Data Integration**
   - Load and structure SRD data (races, classes, backgrounds)
   - Consider [5e-srd-api](https://www.dnd5eapi.co/) or embedded JSON
   - Create data access layer/hooks

### **Phase 2A – Character Display**
   - Build character sheet component (read-only)
   - Render a hardcoded/sample character
   - Display stats, HP, abilities, equipment
   - Character list view (empty state → saved characters)

### **Phase 2B – Character Builder**
   - Step-by-step guided creation wizard
   - Race/class/background selection
   - Ability score assignment
   - Validation (ability scores, equipment choices)
   - Equipment selection

### **Phase 3 – Character Management**
   - Leveling and progression
   - Editable character sheets
   - Long rest/short rest mechanics (HP/spell slot recovery)
   - Inventory management (add/remove items, weight tracking)
   - Character notes field

### **Phase 4 – Advanced Features**
   - Spell management system
   - Custom traits and features
   - Combat tracker integration
   - Condition tracking

### **Phase 5 – Sync & Export**
   - Firebase sync
   - Import/export JSON
   - Optional PDF export

### **Phase 6 – Polish & Package**
   - Tauri desktop packaging
   - Dark/light theme toggle
   - Accessibility audit (keyboard navigation, screen readers)
   - Performance optimization
   - User onboarding/tutorial  

---

## ✅ Success Criteria
- A user can create a character (manually, SRD-compliant).  
- That character can be viewed on a usable character sheet.  
- Data persists across browser sessions (local storage).  
