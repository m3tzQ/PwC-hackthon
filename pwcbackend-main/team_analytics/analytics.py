"""
Player statistics module.

get_player_statistics(status) -> dict
    Takes a player status ("FIT", "INJ", or "SUS") and returns a rich
    statistical breakdown of all players carrying that status.
"""

from django.db.models import Avg, Count, Max, Min, Sum


def get_player_statistics(status: str) -> dict:
    """
    Return aggregated statistics for players filtered by availability status.

    Args:
        status: "FIT" (Match Fit), "INJ" (Injured), or "SUS" (Suspended).
                Case-insensitive.

    Returns:
        A dict with four top-level keys:
          - status / status_label  – the canonical status string and its label
          - summary                – squad-level aggregate metrics
          - match_performance      – aggregated recent match stats for these players
          - position_breakdown     – per-position counts and average fitness
          - top_performers         – up to 5 players ranked by suitability score

    Raises:
        ValueError: if status is not one of FIT / INJ / SUS.
    """
    # Lazy imports keep this module importable before Django apps are ready
    from .models import Player, PlayerMatchStat  # noqa: PLC0415

    STATUS_MAP = {
        "FIT": "Match Fit",
        "INJ": "Injured",
        "SUS": "Suspended",
    }

    normalised = status.strip().upper()
    if normalised not in STATUS_MAP:
        raise ValueError(
            f"Invalid status '{status}'. Must be one of: {', '.join(STATUS_MAP)}."
        )

    players_qs = Player.objects.filter(status=normalised).select_related(
        "primary_position", "team", "current_club"
    )

    # ── Aggregate squad metrics ───────────────────────────────────────────────
    agg = players_qs.aggregate(
        count=Count("id"),
        avg_overall=Avg("overall_rating"),
        avg_form=Avg("recent_form_index"),
        avg_fitness=Avg("fitness_score"),
        avg_pace=Avg("pace"),
        avg_passing=Avg("passing"),
        avg_stamina=Avg("stamina"),
        total_minutes=Sum("minutes_last_5"),
        avg_goal_contrib=Avg("goal_contribution_rate"),
        max_rating=Max("overall_rating"),
        min_rating=Min("overall_rating"),
    )

    # ── Position breakdown ────────────────────────────────────────────────────
    pos_rows = (
        players_qs.values("primary_position__code")
        .annotate(count=Count("id"), avg_fitness=Avg("fitness_score"))
        .order_by("primary_position__code")
    )

    # ── Top performers (suitability = 50% rating + 30% form + 20% fitness) ──
    def _suitability(p):
        return (
            p.overall_rating * 0.5
            + float(p.recent_form_index) * 0.3
            + float(p.fitness_score) * 0.2
        )

    top_players = sorted(players_qs, key=_suitability, reverse=True)[:5]

    # ── Recent match performance aggregates ──────────────────────────────────
    player_ids = list(players_qs.values_list("id", flat=True))
    match_agg = PlayerMatchStat.objects.filter(player_id__in=player_ids).aggregate(
        avg_rating=Avg("rating"),
        avg_minutes=Avg("minutes_played"),
        total_goals=Sum("goals"),
        total_assists=Sum("assists"),
        avg_pass_acc=Avg("pass_accuracy_percent"),
        total_distance=Sum("distance_covered_km"),
    )

    # ── Fitness tier distribution ─────────────────────────────────────────────
    all_fitness = list(players_qs.values_list("fitness_score", flat=True))
    tiers = {"elite": 0, "good": 0, "moderate": 0, "low": 0}
    for fs in all_fitness:
        fs = float(fs)
        if fs >= 85:
            tiers["elite"] += 1
        elif fs >= 70:
            tiers["good"] += 1
        elif fs >= 55:
            tiers["moderate"] += 1
        else:
            tiers["low"] += 1

    return {
        "status": normalised,
        "status_label": STATUS_MAP[normalised],
        "summary": {
            "player_count": agg["count"] or 0,
            "avg_overall_rating": round(agg["avg_overall"] or 0, 1),
            "avg_recent_form": round(float(agg["avg_form"] or 0), 1),
            "avg_fitness_score": round(float(agg["avg_fitness"] or 0), 1),
            "avg_pace": round(agg["avg_pace"] or 0, 1),
            "avg_passing": round(agg["avg_passing"] or 0, 1),
            "avg_stamina": round(agg["avg_stamina"] or 0, 1),
            "total_minutes_last_5_matches": agg["total_minutes"] or 0,
            "avg_goal_contribution_rate": round(
                float(agg["avg_goal_contrib"] or 0), 2
            ),
            "highest_overall_rating": agg["max_rating"],
            "lowest_overall_rating": agg["min_rating"],
        },
        "match_performance": {
            "avg_match_rating": round(float(match_agg["avg_rating"] or 0), 2),
            "avg_minutes_per_appearance": round(
                float(match_agg["avg_minutes"] or 0), 1
            ),
            "total_goals_scored": match_agg["total_goals"] or 0,
            "total_assists": match_agg["total_assists"] or 0,
            "avg_pass_accuracy_pct": round(
                float(match_agg["avg_pass_acc"] or 0), 1
            ),
            "total_distance_covered_km": round(
                float(match_agg["total_distance"] or 0), 1
            ),
        },
        "position_breakdown": [
            {
                "position": row["primary_position__code"] or "N/A",
                "count": row["count"],
                "avg_fitness": round(float(row["avg_fitness"] or 0), 1),
            }
            for row in pos_rows
        ],
        "fitness_tier_distribution": tiers,
        "top_performers": [
            {
                "id": p.id,
                "name": p.name,
                "position": (
                    p.primary_position.code if p.primary_position else "N/A"
                ),
                "club": p.current_club.name if p.current_club else "N/A",
                "overall_rating": p.overall_rating,
                "fitness_score": float(p.fitness_score),
                "recent_form": float(p.recent_form_index),
                "suitability_score": round(_suitability(p), 2),
            }
            for p in top_players
        ],
    }
