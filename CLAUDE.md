# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build application (TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview built application

## Architecture

**Aether** is a D&D 5e Character Creator & Manager built with React 19.1, TypeScript, and Vite.

### Tech Stack
- React 19.1 with TypeScript
- Vite (rolldown-vite variant for performance)
- Tailwind CSS v4.1
- ESLint with React/TypeScript rules

### Key Notes
- Uses rolldown-vite instead of standard Vite (see package.json overrides)
- Currently in MVP phase with placeholder landing page
- Tailwind configured for component scanning in src/
- ESLint includes React Hooks and React Refresh plugins