from datetime import date

from django.db import transaction
from django.db.models import F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .analytics import get_player_statistics

from .models import (
    Club,
    InjuryStatus,
    Match,
    OpponentProfile,
    Player,
    PlayerMatchStat,
    Position,
    RecommendationSnapshot,
    ReplacementDecision,
    Team,
)
from .serializers import (
    ClubSerializer,
    InjuryStatusSerializer,
    InjuryWriteSerializer,
    MatchInsightSerializer,
    PlayerDetailSerializer,
    PlayerListSerializer,
    PlayerMatchStatSerializer,
    PlayerWriteSerializer,
    PositionSerializer,
    RecommendationSnapshotSerializer,
    ReplacementDecisionPatchSerializer,
    ReplacementDecisionSerializer,
    ReplacementDecisionWriteSerializer,
    TeamSerializer,
)


FORMATION_ORDER = ["GK", "RB", "CB", "LB", "DM", "CM", "AM", "RW", "LW", "ST"]


def success_response(data, meta=None):
    return {"success": True, "data": data, "meta": meta or {}, "error": None}


def error_response(code, message, details=None, http_status=status.HTTP_400_BAD_REQUEST):
    return Response(
        {
            "success": False,
            "data": {},
            "meta": {},
            "error": {
                "code": code,
                "message": message,
                "details": details or {},
                "trace_id": str(timezone.now().timestamp()),
            },
        },
        status=http_status,
    )


def parse_int_value(raw_value, field_name, minimum=1, maximum=100):
    try:
        parsed = int(raw_value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be an integer.")

    if parsed < minimum or parsed > maximum:
        raise ValueError(f"{field_name} must be between {minimum} and {maximum}.")
    return parsed


def parse_bool_value(raw_value, default=False):
    if raw_value is None:
        return default
    return str(raw_value).strip().lower() in {"1", "true", "yes", "on"}


def get_candidate_queryset(position, limit=10, exclude_player_id=None):
    queryset = (
        Player.objects.filter(status="FIT")
        .filter(Q(primary_position=position) | Q(secondary_positions=position))
        .select_related("primary_position", "team", "current_club")
        .annotate(position_rank_score=(F("overall_rating") * 0.5) + (F("recent_form_index") * 0.3) + (F("fitness_score") * 0.2))
        .distinct()
        .order_by("-position_rank_score")
    )
    if exclude_player_id:
        queryset = queryset.exclude(pk=exclude_player_id)
    return queryset[:limit]


def serialize_live_candidate(player, position_code):
    return {
        "snapshot_id": None,
        "player_id": player.id,
        "player_name": player.name,
        "position": position_code,
        "rank_score": round(float(player.position_rank_score), 2),
        "confidence": round(min(max(float(player.fitness_score) / 100, 0.1), 0.99), 2),
        "why_recommended": ["Live ranking based on form and fitness"],
        "risk_flags": ["Minor injury risk"] if float(player.fitness_score) < 70 else [],
    }


def build_position_recommendations(position, run_label="auto", limit=10):
    candidates = (
        get_candidate_queryset(position=position, limit=limit)
    )

    created = 0
    for player in candidates:
        RecommendationSnapshot.objects.create(
            position=position,
            player=player,
            rank_score=round(float(player.position_rank_score), 2),
            confidence=round(min(max(float(player.fitness_score) / 100, 0.1), 0.99), 2),
            why_recommended=["High recent form", "Position fit", "Fitness available"],
            risk_flags=["Minor injury risk"] if player.fitness_score < 70 else [],
            run_label=run_label,
        )
        created += 1
    return created


def get_top_options_for_position(position, limit=10):
    snapshots = (
        RecommendationSnapshot.objects.filter(position=position)
        .select_related("player", "position")
        .order_by("-created_at", "-rank_score")
    )

    deduped = []
    seen_players = set()
    for snapshot in snapshots:
        if snapshot.player_id in seen_players:
            continue
        seen_players.add(snapshot.player_id)
        deduped.append(snapshot)
        if len(deduped) >= limit:
            break

    if deduped:
        return RecommendationSnapshotSerializer(deduped, many=True).data

    created = build_position_recommendations(position, run_label="auto-on-demand", limit=limit)
    if created:
        return get_top_options_for_position(position, limit=limit)

    live_candidates = get_candidate_queryset(position=position, limit=limit)
    return [serialize_live_candidate(player, position.code) for player in live_candidates]


def build_match_insight_payload(match):
    serializer = MatchInsightSerializer(match)
    payload = serializer.data
    payload["lineup_scenarios"] = [
        {"label": "Balanced 4-2-3-1", "focus": "midfield stability and controlled transitions"},
        {"label": "Aggressive 4-3-3", "focus": "high press and wing overloads"},
    ]
    profile = OpponentProfile.objects.filter(team=match.away_team).order_by("-updated_at").first()
    payload["opponent_tactical_style"] = profile.tactical_style if profile else "Unknown"
    return payload


@api_view(["GET"])
def health_check(request):
    return Response(success_response({"service": "team_analytics", "status": "ok"}))


@api_view(["GET"])
def dashboard_top_options(request):
    position_code = request.query_params.get("position")
    try:
        limit = parse_int_value(request.query_params.get("limit", 10), "limit", minimum=1, maximum=50)
    except ValueError as exc:
        return error_response("VALIDATION_ERROR", str(exc))

    if not position_code:
        return error_response("VALIDATION_ERROR", "Query param 'position' is required.")

    position = Position.objects.filter(code=position_code.upper()).first()
    if not position:
        return error_response("NOT_FOUND", f"Position '{position_code}' does not exist.", http_status=status.HTTP_404_NOT_FOUND)

    items = get_top_options_for_position(position, limit=limit)
    page_meta = {"page": 1, "page_size": limit, "total_items": len(items), "total_pages": 1}
    return Response(success_response({"items": items}, meta=page_meta))


@api_view(["GET"])
def dashboard_key_injuries(request):
    injuries = InjuryStatus.objects.filter(is_active=True).select_related("player", "player__primary_position").order_by("-start_date")[:10]
    data = InjuryStatusSerializer(injuries, many=True).data
    return Response(success_response({"items": data}))


@api_view(["GET"])
def dashboard_replacement_summary(request):
    injured_count = Player.objects.filter(status="INJ").count()
    fit_count = Player.objects.filter(status="FIT").count()
    active_decisions = ReplacementDecision.objects.filter(is_active=True).count()
    return Response(
        success_response(
            {
                "injured_count": injured_count,
                "fit_count": fit_count,
                "coverage_health_ratio": round(fit_count / max(injured_count, 1), 2),
                "active_replacement_decisions": active_decisions,
            }
        )
    )


@api_view(["GET"])
def dashboard_opponent_summary(request):
    profile = OpponentProfile.objects.order_by("-updated_at").first()
    if not profile:
        return Response(success_response({"opponent": None, "summary": "No opponent profile available."}))

    return Response(
        success_response(
            {
                "opponent": profile.team.name,
                "tactical_style": profile.tactical_style,
                "strengths": profile.strengths,
                "weaknesses": profile.weaknesses,
            }
        )
    )


@api_view(["GET"])
def dashboard_lineup_board(request):
    positions = Position.objects.filter(code__in=FORMATION_ORDER).order_by("code")
    if not positions:
        return Response(success_response({"items": []}))

    by_code = {position.code: position for position in positions}
    ordered_positions = [by_code[code] for code in FORMATION_ORDER if code in by_code]

    decisions = (
        ReplacementDecision.objects.filter(is_active=True)
        .select_related("position", "injured_player", "injured_player__primary_position", "replacement_player")
        .order_by("-created_at")
    )
    decision_by_position = {}
    for decision in decisions:
        decision_position = decision.position or decision.injured_player.primary_position
        if not decision_position:
            continue
        if decision_position.code not in decision_by_position:
            decision_by_position[decision_position.code] = decision

    snapshots = (
        RecommendationSnapshot.objects.filter(position__in=ordered_positions)
        .select_related("position", "player")
        .order_by("position_id", "-created_at", "-rank_score")
    )
    snapshot_by_position_id = {}
    for snapshot in snapshots:
        if snapshot.position_id not in snapshot_by_position_id:
            snapshot_by_position_id[snapshot.position_id] = snapshot

    items = []
    for position in ordered_positions:
        decision = decision_by_position.get(position.code)
        if decision:
            replacement = decision.replacement_player
            items.append(
                {
                    "position": position.code,
                    "player_id": replacement.id,
                    "player_name": replacement.name,
                    "fitness_score": float(replacement.fitness_score),
                    "source": "decision",
                    "decision_id": decision.id,
                    "injured_player_name": decision.injured_player.name,
                }
            )
            continue

        snapshot = snapshot_by_position_id.get(position.id)
        if snapshot:
            items.append(
                {
                    "position": position.code,
                    "player_id": snapshot.player.id,
                    "player_name": snapshot.player.name,
                    "fitness_score": float(snapshot.player.fitness_score),
                    "source": "snapshot",
                    "decision_id": None,
                    "injured_player_name": None,
                }
            )
            continue

        candidates = get_candidate_queryset(position=position, limit=1)
        if candidates:
            candidate = candidates[0]
            items.append(
                {
                    "position": position.code,
                    "player_id": candidate.id,
                    "player_name": candidate.name,
                    "fitness_score": float(candidate.fitness_score),
                    "source": "live",
                    "decision_id": None,
                    "injured_player_name": None,
                }
            )
            continue

        items.append(
            {
                "position": position.code,
                "player_id": None,
                "player_name": "TBD",
                "fitness_score": 0,
                "source": "empty",
                "decision_id": None,
                "injured_player_name": None,
            }
        )

    return Response(success_response({"items": items}))


@api_view(["GET"])
def player_detail(request, player_id):
    player = get_object_or_404(Player, pk=player_id)
    serializer = PlayerDetailSerializer(player)
    return Response(success_response(serializer.data))


@api_view(["GET", "POST"])
def players_collection(request):
    if request.method == "GET":
        queryset = Player.objects.select_related("team", "current_club", "primary_position").order_by("name")
        position_code = request.query_params.get("position")
        status_code = request.query_params.get("status")
        search_query = request.query_params.get("q")

        if position_code:
            queryset = queryset.filter(primary_position__code=position_code.upper())
        if status_code:
            queryset = queryset.filter(status=status_code.upper())
        if search_query:
            queryset = queryset.filter(name__icontains=search_query.strip())

        items = PlayerListSerializer(queryset, many=True).data
        return Response(success_response({"items": items}, meta={"total_items": len(items)}))

    serializer = PlayerWriteSerializer(data=request.data)
    if not serializer.is_valid():
        return error_response("VALIDATION_ERROR", "Invalid player payload.", details=serializer.errors)

    player = serializer.save()
    player.refresh_from_db()
    return Response(success_response(PlayerListSerializer(player).data), status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
def player_update(request, player_id):
    player = get_object_or_404(Player, pk=player_id)
    serializer = PlayerWriteSerializer(instance=player, data=request.data, partial=True)
    if not serializer.is_valid():
        return error_response("VALIDATION_ERROR", "Invalid player update payload.", details=serializer.errors)

    player = serializer.save()
    player.refresh_from_db()
    return Response(success_response(PlayerListSerializer(player).data))


@api_view(["GET"])
def player_history(request, player_id):
    try:
        last_n = parse_int_value(request.query_params.get("last_n", 10), "last_n", minimum=1, maximum=50)
    except ValueError as exc:
        return error_response("VALIDATION_ERROR", str(exc))

    get_object_or_404(Player, pk=player_id)
    stats = (
        PlayerMatchStat.objects.filter(player_id=player_id)
        .select_related("player", "match", "match__home_team", "match__away_team")
        .order_by("-match__date")[:last_n]
    )
    serialized = PlayerMatchStatSerializer(stats, many=True).data
    page_meta = {"page": 1, "page_size": last_n, "total_items": len(serialized), "total_pages": 1}
    return Response(success_response({"items": serialized}, meta=page_meta))


@api_view(["GET"])
def match_insights(request, match_id):
    match = get_object_or_404(Match.objects.select_related("away_team"), pk=match_id)
    return Response(success_response(build_match_insight_payload(match)))


@api_view(["GET"])
def next_match_insights(request):
    today = date.today()
    match = Match.objects.select_related("away_team").filter(date__gte=today).order_by("date").first()
    if not match:
        match = Match.objects.select_related("away_team").order_by("-date").first()
    if not match:
        return Response(success_response({"match": None, "summary": "No match data available."}))
    return Response(success_response(build_match_insight_payload(match)))


@api_view(["GET", "POST"])
def injuries_collection(request):
    if request.method == "GET":
        active_mode = request.query_params.get("active", "true")
        queryset = InjuryStatus.objects.select_related("player", "player__primary_position").order_by("-start_date")
        if active_mode.lower() != "all":
            queryset = queryset.filter(is_active=parse_bool_value(active_mode, default=True))

        items = InjuryStatusSerializer(queryset, many=True).data
        return Response(success_response({"items": items}, meta={"total_items": len(items)}))

    serializer = InjuryWriteSerializer(data=request.data)
    if not serializer.is_valid():
        return error_response("VALIDATION_ERROR", "Invalid injury payload.", details=serializer.errors)

    injury = serializer.save()
    player = injury.player
    if player.status != "INJ":
        player.status = "INJ"
        player.save(update_fields=["status"])

    return Response(success_response(InjuryStatusSerializer(injury).data), status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
def injury_update(request, injury_id):
    injury = get_object_or_404(InjuryStatus.objects.select_related("player"), pk=injury_id)
    serializer = InjuryWriteSerializer(instance=injury, data=request.data, partial=True)
    if not serializer.is_valid():
        return error_response("VALIDATION_ERROR", "Invalid injury update payload.", details=serializer.errors)

    injury = serializer.save()
    player = injury.player
    if injury.is_active:
        if player.status != "INJ":
            player.status = "INJ"
            player.save(update_fields=["status"])
    else:
        still_injured = player.injuries.filter(is_active=True).exclude(pk=injury.pk).exists()
        if not still_injured and player.status == "INJ":
            player.status = "FIT"
            player.save(update_fields=["status"])

    return Response(success_response(InjuryStatusSerializer(injury).data))


@api_view(["GET"])
def positions_list(request):
    positions = Position.objects.order_by("code")
    return Response(success_response({"items": PositionSerializer(positions, many=True).data}))


@api_view(["GET"])
def roster_metadata(request):
    positions = Position.objects.order_by("code")
    teams = Team.objects.order_by("name")
    clubs = Club.objects.order_by("name")
    return Response(
        success_response(
            {
                "positions": PositionSerializer(positions, many=True).data,
                "teams": TeamSerializer(teams, many=True).data,
                "clubs": ClubSerializer(clubs, many=True).data,
            }
        )
    )


@api_view(["GET"])
def replacement_candidates(request):
    player_id = request.query_params.get("player_id")
    if not player_id:
        return error_response("VALIDATION_ERROR", "Query param 'player_id' is required.")

    try:
        player_id_value = parse_int_value(player_id, "player_id", minimum=1, maximum=10_000_000)
        limit = parse_int_value(request.query_params.get("limit", 10), "limit", minimum=1, maximum=50)
    except ValueError as exc:
        return error_response("VALIDATION_ERROR", str(exc))

    injured_player = get_object_or_404(Player.objects.select_related("primary_position"), pk=player_id_value)
    if not injured_player.primary_position:
        return error_response(
            "VALIDATION_ERROR",
            "Injured player does not have a primary position.",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    candidates = get_candidate_queryset(
        position=injured_player.primary_position,
        limit=limit,
        exclude_player_id=injured_player.id,
    )
    items = [serialize_live_candidate(player, injured_player.primary_position.code) for player in candidates]
    return Response(
        success_response(
            {
                "injured_player": {
                    "id": injured_player.id,
                    "name": injured_player.name,
                    "position": injured_player.primary_position.code,
                },
                "items": items,
            },
            meta={"page": 1, "page_size": limit, "total_items": len(items), "total_pages": 1},
        )
    )


@api_view(["GET", "POST"])
def replacement_decisions_collection(request):
    if request.method == "GET":
        include_inactive = parse_bool_value(request.query_params.get("include_inactive"), default=False)
        queryset = ReplacementDecision.objects.select_related(
            "position",
            "injured_player",
            "replacement_player",
        )
        if not include_inactive:
            queryset = queryset.filter(is_active=True)
        items = ReplacementDecisionSerializer(queryset, many=True).data
        return Response(success_response({"items": items}, meta={"total_items": len(items)}))

    serializer = ReplacementDecisionWriteSerializer(data=request.data)
    if not serializer.is_valid():
        return error_response("VALIDATION_ERROR", "Invalid replacement decision payload.", details=serializer.errors)

    injured_player = serializer.validated_data["injured_player"]
    replacement_player = serializer.validated_data["replacement_player"]
    position = serializer.validated_data.get("position") or injured_player.primary_position

    if injured_player.id == replacement_player.id:
        return error_response("VALIDATION_ERROR", "Replacement player must be different from injured player.")
    if replacement_player.status != "FIT":
        return error_response("VALIDATION_ERROR", "Replacement player must be FIT.")
    if not position:
        return error_response("VALIDATION_ERROR", "A target position is required for replacement decisions.")

    position_compatible = (
        replacement_player.primary_position_id == position.id
        or replacement_player.secondary_positions.filter(pk=position.id).exists()
    )
    if not position_compatible:
        return error_response(
            "VALIDATION_ERROR",
            f"Replacement player is not compatible with position '{position.code}'.",
        )

    with transaction.atomic():
        ReplacementDecision.objects.filter(injured_player=injured_player, is_active=True).update(is_active=False)
        decision = ReplacementDecision.objects.create(
            injured_player=injured_player,
            replacement_player=replacement_player,
            position=position,
            notes=serializer.validated_data.get("notes", ""),
            is_active=serializer.validated_data.get("is_active", True),
        )

    payload = ReplacementDecisionSerializer(decision).data
    return Response(success_response(payload), status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
def replacement_decision_update(request, decision_id):
    decision = get_object_or_404(ReplacementDecision, pk=decision_id)
    serializer = ReplacementDecisionPatchSerializer(instance=decision, data=request.data, partial=True)
    if not serializer.is_valid():
        return error_response("VALIDATION_ERROR", "Invalid replacement decision update payload.", details=serializer.errors)

    replacement_player = serializer.validated_data.get("replacement_player", decision.replacement_player)
    position = serializer.validated_data.get("position", decision.position or decision.injured_player.primary_position)

    if replacement_player.status != "FIT":
        return error_response("VALIDATION_ERROR", "Replacement player must be FIT.")
    if position:
        compatible = (
            replacement_player.primary_position_id == position.id
            or replacement_player.secondary_positions.filter(pk=position.id).exists()
        )
        if not compatible:
            return error_response(
                "VALIDATION_ERROR",
                f"Replacement player is not compatible with position '{position.code}'.",
            )

    updated_decision = serializer.save()
    if not updated_decision.position and updated_decision.injured_player.primary_position_id:
        updated_decision.position = updated_decision.injured_player.primary_position
        updated_decision.save(update_fields=["position", "updated_at"])

    payload = ReplacementDecisionSerializer(updated_decision).data
    return Response(success_response(payload))


@api_view(["GET"])
def admin_overview(request):
    last_snapshot = RecommendationSnapshot.objects.order_by("-created_at").first()
    data = {
        "players_total": Player.objects.count(),
        "active_injuries": InjuryStatus.objects.filter(is_active=True).count(),
        "active_replacement_decisions": ReplacementDecision.objects.filter(is_active=True).count(),
        "latest_snapshot_at": last_snapshot.created_at if last_snapshot else None,
        "data_freshness": "healthy" if last_snapshot and (date.today() - last_snapshot.created_at.date()).days <= 1 else "stale",
    }
    return Response(success_response(data))


@api_view(["GET"])
def player_statistics_by_status(request):
    """
    Return aggregated statistics for all players carrying the given status.

    GET /api/v1/players/statistics?status=FIT
    GET /api/v1/players/statistics?status=INJ
    GET /api/v1/players/statistics?status=SUS
    """
    status_param = request.query_params.get("status", "").strip().upper()
    if not status_param:
        return error_response("VALIDATION_ERROR", "Query param 'status' is required (FIT, INJ, SUS).")

    try:
        data = get_player_statistics(status_param)
    except ValueError as exc:
        return error_response("VALIDATION_ERROR", str(exc))

    return Response(success_response(data))


@api_view(["POST"])
def agent_chat(request):
    """
    Query TactiqAI — the LangChain React agent.

    POST /api/v1/agent/chat
    Body: { "query": "Who should replace the injured striker?" }

    Optional: pass "history" as a list of {role, content} objects for
    multi-turn conversations.
    """
    query = (request.data.get("query") or "").strip()
    if not query:
        return error_response("VALIDATION_ERROR", "Body field 'query' is required.")

    history = request.data.get("history", [])

    try:
        from .agent.agent import run_agent  # noqa: PLC0415
        result = run_agent(query, session_history=history)
    except Exception as exc:  # noqa: BLE001
        return error_response("AGENT_ERROR", f"Agent failed: {exc}", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if result.get("error"):
        return error_response("AGENT_ERROR", result["error"], http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(
        success_response(
            {
                "answer": result["answer"],
                "tool_steps": result["steps"],
            }
        )
    )


@api_view(["POST"])
def admin_recompute_recommendations(request):
    position_code = request.data.get("position")
    run_label = request.data.get("run_label", "manual")
    clear_existing = parse_bool_value(request.data.get("clear_existing"), default=False)
    if not position_code:
        return error_response("VALIDATION_ERROR", "Body field 'position' is required.")

    position = Position.objects.filter(code=position_code.upper()).first()
    if not position:
        return error_response("NOT_FOUND", f"Position '{position_code}' does not exist.", http_status=status.HTTP_404_NOT_FOUND)

    if clear_existing:
        RecommendationSnapshot.objects.filter(position=position).delete()

    created = build_position_recommendations(position, run_label=run_label)

    return Response(
        success_response({"created_snapshots": created, "run_label": run_label, "clear_existing": clear_existing}),
        status=status.HTTP_201_CREATED,
    )