# Jordan WC 2026 MVP - Hackathon Scoring Plan

## Goal
Maximize judging score while delivering a realistic MVP that is demo-ready and technically clean.

## Rules and Compliance
- Build with Django REST backend + React frontend over REST API.
- Respect AI usage constraints and only use allowed boost windows.
- Maintain a Boost Log: timestamp, option used, reason, output impact.

## Scoring Strategy

### Business Rank (40%)
1. Innovation and originality
- Position the core differentiator as an injury-aware, opponent-fit replacement engine for Jordan.

2. Practicality and feasibility
- Keep scope strict: 5 pages, contract-first API, no unstable advanced ML dependency for MVP.

3. Team collaboration
- Assign clear FE/BE ownership by endpoint group and run daily contract sync.

4. Presentation and communication
- Use a narrative demo (injury -> replacement options -> evidence -> strategy).

5. Problem understanding and effectiveness
- Show measurable outcomes:
  - reduced decision time
  - clearer recommendation reasoning
  - better lineup confidence

### Technical Rank (60%)
1. Code quality and best practices
- Enforce linting, typed DTOs, service-layer scoring logic.

2. File structure and organization
- Modularize by domain: players, matches, insights, admin.

3. Performance and optimization
- Precompute recommendation snapshots and cache dashboard data.

4. UI/UX quality
- Coach-friendly layout, clear priorities, strong visual hierarchy, obvious next action.

5. Boost impact
- If boosts are used, present direct technical or UX gains tied to each boost.

## Must-Have Deliverables for Judges
- Product name + tagline
- Visual identity basics (palette, typography, icon style)
- Architecture diagram slide
- Value proposition slide
- Live demo dataset reset script

## Demo Script (4 Scenes)
1. Injury event appears for key player.
2. Dashboard shows top 10 replacements by position with rationale and risk flags.
3. Player profile and history validate chosen replacement.
4. Match insights adapt strategy and lineup for upcoming opponent.

## Day-by-Day Execution (Suggested)

### Day 1
- Finalize models and endpoint contracts.
- Scaffold frontend routes and mocked data bindings.
- Seed baseline dataset.

### Day 2
- Implement ranking logic and core API endpoints.
- Integrate frontend with real backend.
- Build dashboard + profile + history pages.

### Day 3
- Complete match insights + admin quick controls.
- Polish UX and performance.
- Rehearse final demo and finalize judging slides.

## Exit Criteria
- End-to-end flow is stable and understandable by judges in less than 5 minutes.
- Every recommendation has visible explanation fields.
- API/FE integration is reliable with no contract mismatches.
- Presentation clearly links product decisions to scoring criteria.
