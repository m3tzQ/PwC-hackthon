# Jordan WC 2026 MVP - Full Build Plan

## 1) Objective
Build an MVP web app that helps Coach Jamal Sellami make faster and smarter decisions for Jordan at World Cup 2026, especially under injury pressure and limited preparation time.

Core product outcomes:
- Identify best replacements for injured or unavailable players.
- Show top options by position with explainable ranking.
- Provide player profile and match-history insights.
- Provide opponent-specific match insights and lineup scenarios.
- Provide fast admin operations for data updates and recompute flows.

## 2) Chosen Stack
- Backend: Django + Django REST Framework
- Database: PostgreSQL
- Frontend: React (TypeScript, Vite) using refine + shadcn/ui
- API style: Versioned REST (`/api/v1`)
- Architecture: Separate frontend and backend teams with contract-first APIs

Implementation roots in this workspace:
- Frontend app: `frontend/`
- Backend app: `PwC/backend/`

## 3) MVP Pages (Requested Scope)
1. Dashboard / Home
- Top 10 replacement options by position
- Field-position visual with best candidates
- Key injury alerts and quick opponent snapshot

2. Player Profile
- Player identity and role positions
- Season summary, strengths, and suitability score

3. Player History & Previous Match Stats
- Match-by-match timeline
- Rolling trends (minutes, goals/assists, fitness/form)

4. Match Insights
- Opponent profile and tactical strengths/weaknesses
- Suggested Jordan lineup scenarios and key battles

5. Admin Dashboard
- Quick access to ingestion status, injuries, freshness, recompute
- Fast data maintenance and operational controls

## 4) Backend Layer Plan

### 4.1 Project Setup
- Add `djangorestframework`, `django-cors-headers`, `psycopg`.
- Configure CORS for frontend origin.
- Keep Django admin enabled for speed.
- Add API include under `/api/v1`.

### 4.2 Suggested Django Apps
- `core`: shared base models/utilities
- `players`: player, team, club, position, injuries, availability
- `matches`: competitions, seasons, matches, lineups, events, player match stats
- `insights`: opponent profile, recommendation scoring/snapshots
- `api`: serializers, views/controllers, routers, response envelope helpers

### 4.3 Base Models (Suggested)
- Team
- Club
- Position
- Player
- Competition
- Season
- Match
- MatchLineup
- MatchEvent
- PlayerMatchStat
- InjuryStatus
- AvailabilityWindow
- OpponentProfile
- RecommendationSnapshot

### 4.4 Data/Modeling Rules
- One `Player` -> many `PlayerMatchStat` rows
- One `Match` -> many lineup rows, events, and player stats
- Injuries and availability are date-bounded
- Recommendation runs are persisted for auditability and explainability

### 4.5 Computed/Derived Metrics
- `recent_form_index`
- `fitness_score`
- `minutes_last_5`
- `goal_contribution_rate`
- `position_rank_score`

## 5) API Controller Design (Contract-First)

### 5.1 Unified Response Envelope
```json
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
```

### 5.2 Standard Error Shape
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Human-readable message",
  "details": {},
  "trace_id": "uuid-or-request-id"
}
```

### 5.3 Pagination Shape
```json
{
  "page": 1,
  "page_size": 10,
  "total_items": 124,
  "total_pages": 13
}
```

### 5.4 Controller Groups
- Dashboard controllers:
  - Top options per position
  - Key injuries
  - Replacement summary
  - Opponent quick summary

- Player controllers:
  - Profile details
  - Season aggregates
  - Role compatibility

- History controllers:
  - Previous matches timeline
  - Form and fitness trends

- Match insight controllers:
  - Opponent strengths/weaknesses
  - Suggested lineup scenarios
  - Key tactical battles

- Admin controllers:
  - Ingestion/freshness overview
  - Injury management hooks
  - Recommendation recompute trigger

### 5.5 Example Endpoints
- `GET /api/v1/dashboard/top-options?position=ST&limit=10`
- `GET /api/v1/players/{id}`
- `GET /api/v1/players/{id}/history?last_n=10`
- `GET /api/v1/matches/{id}/insights`
- `GET /api/v1/admin/overview`
- `POST /api/v1/admin/recommendations/recompute`

### 5.6 Example Top Options Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "player_id": 18,
        "player_name": "Player Name",
        "position": "ST",
        "rank_score": 86.4,
        "confidence": 0.81,
        "why_recommended": ["High recent form", "Strong aerial duels"],
        "risk_flags": ["Minor recent knock"]
      }
    ]
  },
  "meta": {
    "page": 1,
    "page_size": 10,
    "total_items": 10,
    "total_pages": 1
  },
  "error": null
}
```

## 6) Data Pipeline and Scoring Logic
- Build ingestion adapters for CSV/API feeds (players, matches, injuries)
- Normalize metrics (per-90 and recency weighting)
- Compute replacement score from:
  - position fit
  - recent form
  - fitness/availability
  - experience
  - opponent fit
  - injury risk penalty
- Store each scoring run in `RecommendationSnapshot`

## 7) Frontend Layer Plan (`frontend/`)

### 7.1 Structure
- `src/app` - providers/router shell
- `src/pages` - route pages
- `src/features` - dashboard, players, matches, admin modules
- `src/components` - shared UI
- `src/api` - typed client and endpoint adapters
- `src/types` - API contracts and domain DTOs

### 7.2 UI Implementation
- refine for admin resources and quick CRUD surfaces
- shadcn/ui for cards, tables, dialogs, filters
- charts for trend lines/radar/comparison views
- field map component for position-based best options

### 7.3 UX Priorities
- Fast perceived performance: skeletons, optimistic updates, query caching
- Explainability: always show rationale and risk flags with recommendations
- Clear error/empty states for all critical pages

## 8) Testing and Quality Gates
- Backend:
  - Model integrity tests
  - Service/scoring tests
  - API contract tests
  - Pagination/filter tests
- Frontend:
  - Route render tests
  - API hook mapping tests
  - Visualization smoke tests
- Quality gates:
  - lint passes
  - stable seed data
  - demo endpoints meet latency target

## 9) Hackathon Scoring Alignment

Business Rank (40%):
- Innovation: Jordan-specific injury-aware replacement engine
- Practicality: strict 5-page MVP + stable contracts
- Teamwork: FE/BE contract ownership and sync cadence
- Communication: scenario-driven demo script
- Problem understanding: measurable decision-clarity improvements

Technical Rank (60%):
- Clean architecture and code quality
- Clear module organization by domain
- Precompute/cache for dashboard speed
- Strong UI/UX for coach decision flow
- Show concrete impact of any allowed boost usage

## 10) Governance and Delivery
- Keep a Boost Log when allowed options are used (time, reason, impact)
- Keep architecture diagram + value proposition slide for judging
- Demo storyline:
  1) key injury event
  2) top 10 replacements with explainability
  3) player profile/history evidence
  4) opponent-specific insights and lineup scenario

## 11) Final Acceptance Checklist
- API contracts are stable and documented
- Dashboard shows top options by position with rationale
- Player pages show profile + historical trends
- Match insights page supports tactical decisioning
- Admin page supports data freshness and recompute operations
- End-to-end demo works with seeded Jordan-focused dataset
