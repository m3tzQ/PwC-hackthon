"""
LangChain tools wired to the Django ORM.

Each tool is a thin, well-typed wrapper that speaks the language the React
agent expects: plain text or JSON-serialisable dicts.  All Django imports are
deferred (inside the function body) so this module can be imported before
Django is fully initialised.
"""

import json
from datetime import date

from langchain_core.tools import tool


# ── 1. Squad statistics by status ────────────────────────────────────────────

@tool
def get_squad_statistics(status: str) -> str:
    """
    Return aggregated statistics for players grouped by their availability
    status.

    Args:
        status: One of 'FIT', 'INJ', or 'SUS'.

    Returns:
        JSON string with summary metrics, position breakdown, fitness
        tier distribution, top performers, and recent match performance.
    """
    from team_analytics.analytics import get_player_statistics  # noqa: PLC0415

    try:
        result = get_player_statistics(status)
        return json.dumps(result, default=str)
    except ValueError as exc:
        return json.dumps({"error": str(exc)})


# ── 2. Find best replacements for an injured player ───────────────────────────

@tool
def find_best_replacement(player_name: str, limit: int = 5) -> str:
    """
    Given the name of an injured or suspended player, return the top
    candidates who can cover their primary position, ranked by suitability.

    Args:
        player_name: Full or partial name of the unavailable player.
        limit: Maximum number of candidates to return (default 5).

    Returns:
        JSON string listing replacement candidates with scores and risk flags.
    """
    from django.db.models import F, Q  # noqa: PLC0415

    from team_analytics.models import Player  # noqa: PLC0415

    injured = (
        Player.objects.filter(name__icontains=player_name)
        .select_related("primary_position")
        .first()
    )
    if not injured:
        return json.dumps({"error": f"No player found matching '{player_name}'."})

    if not injured.primary_position:
        return json.dumps(
            {"error": f"Player '{injured.name}' has no primary position assigned."}
        )

    candidates = (
        Player.objects.filter(status="FIT")
        .filter(
            Q(primary_position=injured.primary_position)
            | Q(secondary_positions=injured.primary_position)
        )
        .exclude(pk=injured.pk)
        .annotate(
            suitability=(
                F("overall_rating") * 0.5
                + F("recent_form_index") * 0.3
                + F("fitness_score") * 0.2
            )
        )
        .select_related("primary_position", "current_club")
        .distinct()
        .order_by("-suitability")[:limit]
    )

    return json.dumps(
        {
            "unavailable_player": {
                "id": injured.id,
                "name": injured.name,
                "status": injured.status,
                "position": injured.primary_position.code,
            },
            "replacements": [
                {
                    "id": c.id,
                    "name": c.name,
                    "position": c.primary_position.code if c.primary_position else "N/A",
                    "club": c.current_club.name if c.current_club else "N/A",
                    "overall_rating": c.overall_rating,
                    "fitness_score": float(c.fitness_score),
                    "recent_form": float(c.recent_form_index),
                    "suitability_score": round(float(c.suitability), 2),
                    "risk_flags": (
                        ["Fitness below 70 — monitor closely"]
                        if float(c.fitness_score) < 70
                        else []
                    ),
                }
                for c in candidates
            ],
        },
        default=str,
    )


# ── 3. Full squad fitness health report ──────────────────────────────────────

@tool
def analyze_squad_fitness() -> str:
    """
    Produce a squad-wide fitness health report segmented by availability
    status (FIT / INJ / SUS) and fitness tier.

    Returns:
        JSON string with counts, averages, and players that need monitoring.
    """
    from django.db.models import Avg, Count, Q  # noqa: PLC0415

    from team_analytics.models import Player  # noqa: PLC0415

    totals = Player.objects.aggregate(
        total=Count("id"),
        fit=Count("id", filter=Q(status="FIT")),
        injured=Count("id", filter=Q(status="INJ")),
        suspended=Count("id", filter=Q(status="SUS")),
        avg_fitness=Avg("fitness_score"),
    )

    # Players at risk: FIT but fitness < 70
    at_risk = list(
        Player.objects.filter(status="FIT", fitness_score__lt=70)
        .select_related("primary_position")
        .values("id", "name", "fitness_score", "primary_position__code")
        .order_by("fitness_score")
    )

    # Top 3 fittest players
    peak = list(
        Player.objects.filter(status="FIT")
        .select_related("primary_position")
        .values("id", "name", "fitness_score", "primary_position__code")
        .order_by("-fitness_score")[:3]
    )

    return json.dumps(
        {
            "squad_totals": {
                "total_players": totals["total"],
                "fit": totals["fit"],
                "injured": totals["injured"],
                "suspended": totals["suspended"],
                "squad_avg_fitness": round(float(totals["avg_fitness"] or 0), 1),
            },
            "players_needing_monitoring": at_risk,
            "peak_fitness_players": peak,
        },
        default=str,
    )


# ── 4. Active injury report ───────────────────────────────────────────────────

@tool
def get_injury_report() -> str:
    """
    Return all active injuries with player details, severity, and expected
    return date.  Also flags injuries whose expected return date has already
    passed (may indicate an update is needed).

    Returns:
        JSON string with a list of active injuries, overdue flags, and counts.
    """
    from team_analytics.models import InjuryStatus  # noqa: PLC0415

    today = date.today()
    injuries = InjuryStatus.objects.filter(is_active=True).select_related(
        "player", "player__primary_position"
    ).order_by("-start_date")

    items = []
    overdue_count = 0
    for inj in injuries:
        overdue = (
            inj.expected_return_date is not None
            and inj.expected_return_date < today
        )
        if overdue:
            overdue_count += 1
        items.append(
            {
                "injury_id": inj.id,
                "player_id": inj.player.id,
                "player_name": inj.player.name,
                "position": (
                    inj.player.primary_position.code
                    if inj.player.primary_position
                    else "N/A"
                ),
                "injury_name": inj.injury_name,
                "severity": inj.severity,
                "start_date": str(inj.start_date),
                "expected_return_date": (
                    str(inj.expected_return_date)
                    if inj.expected_return_date
                    else "Unknown"
                ),
                "days_until_return": (
                    (inj.expected_return_date - today).days
                    if inj.expected_return_date
                    else None
                ),
                "overdue_flag": overdue,
            }
        )

    return json.dumps(
        {
            "active_injury_count": len(items),
            "overdue_assessments": overdue_count,
            "injuries": items,
        },
        default=str,
    )


# ── 5. Match readiness assessment ────────────────────────────────────────────

@tool
def assess_match_readiness() -> str:
    """
    Score the squad's overall readiness for the next upcoming match.

    The readiness score (0–100) is derived from:
      • % of first-choice positions covered by fit players  (40 pts)
      • Average fitness of the FIT pool                     (35 pts)
      • Average recent form index of the FIT pool           (25 pts)

    Returns:
        JSON string with readiness score, grade, coverage gaps, and
        the next match details.
    """
    from datetime import date  # noqa: PLC0415

    from django.db.models import Avg  # noqa: PLC0415

    from team_analytics.models import Match, Player, Position  # noqa: PLC0415

    today = date.today()
    next_match = (
        Match.objects.select_related("away_team", "competition")
        .filter(date__gte=today)
        .order_by("date")
        .first()
    )

    # Formation positions required
    formation_positions = ["GK", "RB", "CB", "LB", "DM", "CM", "AM", "RW", "LW", "ST"]

    fit_agg = Player.objects.filter(status="FIT").aggregate(
        avg_fitness=Avg("fitness_score"),
        avg_form=Avg("recent_form_index"),
    )
    avg_fitness = float(fit_agg["avg_fitness"] or 0)
    avg_form = float(fit_agg["avg_form"] or 0)

    # Check coverage for each formation slot
    from django.db.models import Q  # noqa: PLC0415

    coverage_gaps = []
    covered = 0
    for pos_code in formation_positions:
        has_cover = Player.objects.filter(
            status="FIT"
        ).filter(
            Q(primary_position__code=pos_code) | Q(secondary_positions__code=pos_code)
        ).exists()
        if has_cover:
            covered += 1
        else:
            coverage_gaps.append(pos_code)

    coverage_pct = (covered / len(formation_positions)) * 100

    # Composite score
    score = (
        (coverage_pct / 100) * 40
        + (avg_fitness / 100) * 35
        + (avg_form / 100) * 25
    )
    score = round(score, 1)

    if score >= 80:
        grade = "A — Squad is well prepared"
    elif score >= 65:
        grade = "B — Ready with minor concerns"
    elif score >= 50:
        grade = "C — Moderate readiness, rotation needed"
    else:
        grade = "D — High risk, significant gaps"

    return json.dumps(
        {
            "readiness_score": score,
            "grade": grade,
            "formation_coverage_pct": round(coverage_pct, 1),
            "avg_squad_fitness": round(avg_fitness, 1),
            "avg_squad_form": round(avg_form, 1),
            "coverage_gaps": coverage_gaps,
            "next_match": (
                {
                    "match_id": next_match.id,
                    "opponent": next_match.away_team.name,
                    "date": str(next_match.date),
                    "competition": (
                        next_match.competition.name
                        if next_match.competition
                        else "Friendly"
                    ),
                }
                if next_match
                else None
            ),
        },
        default=str,
    )


# ── 6. Tactical intelligence report ──────────────────────────────────────────

@tool
def get_tactical_insights(opponent_name: str = "") -> str:
    """
    Generate a tactical intelligence report for the next opponent.

    Combines the opponent's scouted profile (tactical style, strengths,
    weaknesses) with Jordan's available assets (top-form FIT players) to
    suggest exploitation vectors and players to deploy against identified
    weaknesses.

    Args:
        opponent_name: Optional name filter. If empty, uses the most
                       recently updated opponent profile.

    Returns:
        JSON string with tactical recommendations and key player suggestions.
    """
    from django.db.models import Q  # noqa: PLC0415

    from team_analytics.models import OpponentProfile, Player  # noqa: PLC0415

    qs = OpponentProfile.objects.select_related("team").order_by("-updated_at")
    if opponent_name.strip():
        qs = qs.filter(team__name__icontains=opponent_name.strip())
    profile = qs.first()

    if not profile:
        return json.dumps(
            {"error": "No opponent profile found. Make sure scouting data exists."}
        )

    weaknesses = profile.weaknesses or []

    # Map common weakness keywords → positions that exploit them
    WEAKNESS_POSITION_MAP = {
        "space behind fullbacks": ["ST", "RW", "LW"],
        "fullback": ["ST", "RW", "LW"],
        "counter": ["ST", "RW", "LW", "AM"],
        "set-piece": ["CB", "ST"],
        "second-ball": ["DM", "CM"],
        "midfield": ["CM", "DM", "AM"],
        "aerial": ["CB", "ST"],
        "pace": ["RW", "LW", "ST"],
        "press": ["CM", "DM"],
    }

    exploit_positions = set()
    for w in weaknesses:
        for keyword, positions in WEAKNESS_POSITION_MAP.items():
            if keyword in w.lower():
                exploit_positions.update(positions)

    if not exploit_positions:
        exploit_positions = {"RW", "LW", "ST"}  # default attacking pressure

    # Find top fit players for those positions
    key_players = list(
        Player.objects.filter(status="FIT")
        .filter(
            Q(primary_position__code__in=exploit_positions)
            | Q(secondary_positions__code__in=exploit_positions)
        )
        .select_related("primary_position", "current_club")
        .distinct()
        .order_by("-recent_form_index", "-fitness_score")[:6]
        .values(
            "id",
            "name",
            "primary_position__code",
            "overall_rating",
            "recent_form_index",
            "fitness_score",
            "goal_contribution_rate",
        )
    )

    return json.dumps(
        {
            "opponent": profile.team.name,
            "tactical_style": profile.tactical_style,
            "scouted_strengths": profile.strengths,
            "scouted_weaknesses": weaknesses,
            "exploit_vectors": list(exploit_positions),
            "recommended_key_players": key_players,
            "tactical_summary": (
                f"Against {profile.team.name}'s {profile.tactical_style.lower()}, "
                f"focus on exploiting: {', '.join(weaknesses[:2]) if weaknesses else 'standard press-breaks'}. "
                f"Deploy high-pace options in {', '.join(list(exploit_positions)[:3])} slots."
            ),
        },
        default=str,
    )


# ── 7. Position-specific depth chart ─────────────────────────────────────────

@tool
def get_position_depth(position_code: str) -> str:
    """
    Return a depth chart for a specific position — every player (FIT or not)
    who can play there, with their fitness, form, and current status.

    Args:
        position_code: Two-to-three letter code, e.g. 'ST', 'GK', 'CB', 'DM'.

    Returns:
        JSON string with a ranked depth chart for the position.
    """
    from django.db.models import Q  # noqa: PLC0415

    from team_analytics.models import Player  # noqa: PLC0415

    code = position_code.strip().upper()

    players = (
        Player.objects.filter(
            Q(primary_position__code=code) | Q(secondary_positions__code=code)
        )
        .select_related("primary_position", "current_club", "team")
        .distinct()
        .order_by("-overall_rating")
    )

    if not players.exists():
        return json.dumps(
            {"error": f"No players found for position '{code}'."}
        )

    STATUS_LABEL = {"FIT": "Available", "INJ": "Injured", "SUS": "Suspended"}

    return json.dumps(
        {
            "position": code,
            "depth_chart": [
                {
                    "rank": idx + 1,
                    "id": p.id,
                    "name": p.name,
                    "status": STATUS_LABEL.get(p.status, p.status),
                    "is_primary": (
                        p.primary_position.code == code
                        if p.primary_position
                        else False
                    ),
                    "club": p.current_club.name if p.current_club else "N/A",
                    "overall_rating": p.overall_rating,
                    "fitness_score": float(p.fitness_score),
                    "recent_form": float(p.recent_form_index),
                    "pace": p.pace,
                    "passing": p.passing,
                    "stamina": p.stamina,
                }
                for idx, p in enumerate(players)
            ],
        },
        default=str,
    )


# ── Public list for agent consumption ────────────────────────────────────────

ALL_TOOLS = [
    get_squad_statistics,
    find_best_replacement,
    analyze_squad_fitness,
    get_injury_report,
    assess_match_readiness,
    get_tactical_insights,
    get_position_depth,
]
