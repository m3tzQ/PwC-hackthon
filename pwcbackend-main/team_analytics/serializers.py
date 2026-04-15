from rest_framework import serializers

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


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ["id", "name", "fifa_code"]


class ClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ["id", "name", "country"]


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = ["id", "code", "label"]


class PlayerListSerializer(serializers.ModelSerializer):
    primary_position = serializers.CharField(source="primary_position.code", default=None)
    team_name = serializers.CharField(source="team.name")
    current_club_name = serializers.CharField(source="current_club.name", default=None)
    suitability_score = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = [
            "id",
            "name",
            "status",
            "primary_position",
            "team_name",
            "current_club_name",
            "overall_rating",
            "recent_form_index",
            "fitness_score",
            "minutes_last_5",
            "goal_contribution_rate",
            "suitability_score",
        ]

    def get_suitability_score(self, obj):
        return round((obj.overall_rating * 0.5) + (float(obj.recent_form_index) * 0.3) + (float(obj.fitness_score) * 0.2), 2)


class PlayerWriteSerializer(serializers.ModelSerializer):
    team_id = serializers.PrimaryKeyRelatedField(source="team", queryset=Team.objects.all())
    current_club_id = serializers.PrimaryKeyRelatedField(
        source="current_club",
        queryset=Club.objects.all(),
        required=False,
        allow_null=True,
    )
    primary_position_id = serializers.PrimaryKeyRelatedField(
        source="primary_position",
        queryset=Position.objects.all(),
        required=False,
        allow_null=True,
    )
    secondary_position_ids = serializers.PrimaryKeyRelatedField(
        source="secondary_positions",
        queryset=Position.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Player
        fields = [
            "id",
            "name",
            "team_id",
            "current_club_id",
            "primary_position_id",
            "secondary_position_ids",
            "is_local_league",
            "status",
            "overall_rating",
            "pace",
            "passing",
            "stamina",
            "recent_form_index",
            "fitness_score",
            "minutes_last_5",
            "goal_contribution_rate",
        ]


class InjuryStatusSerializer(serializers.ModelSerializer):
    player_id = serializers.IntegerField(source="player.id")
    player_name = serializers.CharField(source="player.name")
    position = serializers.CharField(source="player.primary_position.code", default=None)

    class Meta:
        model = InjuryStatus
        fields = [
            "id",
            "player_id",
            "player_name",
            "position",
            "injury_name",
            "severity",
            "start_date",
            "expected_return_date",
            "is_active",
        ]


class InjuryWriteSerializer(serializers.ModelSerializer):
    player_id = serializers.PrimaryKeyRelatedField(source="player", queryset=Player.objects.all())

    class Meta:
        model = InjuryStatus
        fields = [
            "id",
            "player_id",
            "injury_name",
            "severity",
            "start_date",
            "expected_return_date",
            "is_active",
        ]


class PlayerMatchStatSerializer(serializers.ModelSerializer):
    opponent = serializers.SerializerMethodField()
    match_date = serializers.DateField(source="match.date", read_only=True)

    class Meta:
        model = PlayerMatchStat
        fields = [
            "id",
            "match_date",
            "opponent",
            "minutes_played",
            "distance_covered_km",
            "pass_accuracy_percent",
            "rating",
            "goals",
            "assists",
        ]

    def get_opponent(self, obj):
        player_team_id = getattr(obj.player, "team_id", None)
        if player_team_id and obj.match.home_team_id == player_team_id:
            return obj.match.away_team.name
        if player_team_id and obj.match.away_team_id == player_team_id:
            return obj.match.home_team.name
        return obj.match.away_team.name


class PlayerDetailSerializer(serializers.ModelSerializer):
    primary_position = serializers.CharField(source="primary_position.code", default=None)
    season_summary = serializers.SerializerMethodField()
    strengths = serializers.SerializerMethodField()
    suitability_score = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = [
            "id",
            "name",
            "status",
            "primary_position",
            "overall_rating",
            "recent_form_index",
            "fitness_score",
            "minutes_last_5",
            "goal_contribution_rate",
            "season_summary",
            "strengths",
            "suitability_score",
        ]

    def get_season_summary(self, obj):
        return {
            "minutes_last_5": obj.minutes_last_5,
            "goal_contribution_rate": float(obj.goal_contribution_rate),
        }

    def get_strengths(self, obj):
        strength_list = []
        if obj.passing >= 70:
            strength_list.append("Strong passing")
        if obj.stamina >= 70:
            strength_list.append("High stamina")
        if obj.pace >= 70:
            strength_list.append("Good pace")
        return strength_list or ["Balanced profile"]

    def get_suitability_score(self, obj):
        return round((obj.overall_rating * 0.5) + (float(obj.recent_form_index) * 0.3) + (float(obj.fitness_score) * 0.2), 2)


class RecommendationSnapshotSerializer(serializers.ModelSerializer):
    snapshot_id = serializers.IntegerField(source="id")
    player_id = serializers.IntegerField(source="player.id")
    player_name = serializers.CharField(source="player.name")
    position = serializers.CharField(source="position.code")

    class Meta:
        model = RecommendationSnapshot
        fields = [
            "snapshot_id",
            "player_id",
            "player_name",
            "position",
            "rank_score",
            "confidence",
            "why_recommended",
            "risk_flags",
        ]


class OpponentProfileSerializer(serializers.ModelSerializer):
    opponent = serializers.CharField(source="team.name")

    class Meta:
        model = OpponentProfile
        fields = ["opponent", "tactical_style", "strengths", "weaknesses", "updated_at"]


class MatchInsightSerializer(serializers.ModelSerializer):
    opponent = serializers.CharField(source="away_team.name")
    tactical_strengths = serializers.SerializerMethodField()
    tactical_weaknesses = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = ["id", "date", "opponent", "goals_for", "goals_against", "tactical_strengths", "tactical_weaknesses"]

    def get_tactical_strengths(self, obj):
        profile = OpponentProfile.objects.filter(team=obj.away_team).order_by("-updated_at").first()
        return profile.strengths if profile else []

    def get_tactical_weaknesses(self, obj):
        profile = OpponentProfile.objects.filter(team=obj.away_team).order_by("-updated_at").first()
        return profile.weaknesses if profile else []


class ReplacementDecisionSerializer(serializers.ModelSerializer):
    injured_player_id = serializers.IntegerField(source="injured_player.id")
    injured_player_name = serializers.CharField(source="injured_player.name")
    replacement_player_id = serializers.IntegerField(source="replacement_player.id")
    replacement_player_name = serializers.CharField(source="replacement_player.name")
    position = serializers.CharField(source="position.code", default=None)

    class Meta:
        model = ReplacementDecision
        fields = [
            "id",
            "injured_player_id",
            "injured_player_name",
            "replacement_player_id",
            "replacement_player_name",
            "position",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
        ]


class ReplacementDecisionWriteSerializer(serializers.ModelSerializer):
    injured_player_id = serializers.PrimaryKeyRelatedField(source="injured_player", queryset=Player.objects.all())
    replacement_player_id = serializers.PrimaryKeyRelatedField(source="replacement_player", queryset=Player.objects.all())
    position_id = serializers.PrimaryKeyRelatedField(
        source="position",
        queryset=Position.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ReplacementDecision
        fields = [
            "id",
            "injured_player_id",
            "replacement_player_id",
            "position_id",
            "notes",
            "is_active",
        ]


class ReplacementDecisionPatchSerializer(serializers.ModelSerializer):
    replacement_player_id = serializers.PrimaryKeyRelatedField(
        source="replacement_player",
        queryset=Player.objects.all(),
        required=False,
    )
    position_id = serializers.PrimaryKeyRelatedField(
        source="position",
        queryset=Position.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ReplacementDecision
        fields = ["replacement_player_id", "position_id", "notes", "is_active"]