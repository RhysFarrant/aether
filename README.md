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
1. **Phase 1 – Core Setup**  
   - React + Tailwind scaffold  
   - Character data model  
   - Placeholder UI → basic character sheet  
   - Local persistence  

2. **Phase 2 – Character Builder**  
   - Step-by-step guided creation  
   - Validation (ability scores, equipment choices)  

3. **Phase 3 – SRD Reference**  
   - Browse classes, races, and backgrounds  
   - Extendable reference for spells & items  

4. **Phase 4 – Character Management**  
   - Leveling and progression  
   - Editable character sheets  

5. **Phase 5 – Sync & Export**  
   - Firebase sync  
   - Import/export JSON  
   - Optional PDF export  

---

## ✅ Success Criteria
- A user can create a character (manually, SRD-compliant).  
- That character can be viewed on a usable character sheet.  
- Data persists across browser sessions (local storage).  
