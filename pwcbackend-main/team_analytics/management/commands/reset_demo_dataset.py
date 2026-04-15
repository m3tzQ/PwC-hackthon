from datetime import date, timedelta

from django.core.management.base import BaseCommand

from team_analytics.models import (
    Club,
    Competition,
    InjuryStatus,
    Match,
    OpponentProfile,
    Player,
    PlayerMatchStat,
    Position,
    RecommendationSnapshot,
    ReplacementDecision,
    Season,
    Team,
)


class Command(BaseCommand):
    help = "Reset and seed demo dataset for Jordan WC 2026 MVP."

    def handle(self, *args, **kwargs):
        self.stdout.write("Resetting demo data...")
        ReplacementDecision.objects.all().delete()
        RecommendationSnapshot.objects.all().delete()
        InjuryStatus.objects.all().delete()
        PlayerMatchStat.objects.all().delete()
        Match.objects.all().delete()
        OpponentProfile.objects.all().delete()
        Player.objects.all().delete()
        Position.objects.all().delete()
        Club.objects.all().delete()
        Competition.objects.all().delete()
        Season.objects.all().delete()
        Team.objects.all().delete()

        jordan = Team.objects.create(name="Jordan", fifa_code="JOR")
        spain = Team.objects.create(name="Spain", fifa_code="ESP")
        morocco = Team.objects.create(name="Morocco", fifa_code="MAR")

        positions = {
            "GK": Position.objects.create(code="GK", label="Goalkeeper"),
            "RB": Position.objects.create(code="RB", label="Right Back"),
            "CB": Position.objects.create(code="CB", label="Center Back"),
            "LB": Position.objects.create(code="LB", label="Left Back"),
            "DM": Position.objects.create(code="DM", label="Defensive Midfielder"),
            "CM": Position.objects.create(code="CM", label="Central Midfielder"),
            "AM": Position.objects.create(code="AM", label="Attacking Midfielder"),
            "RW": Position.objects.create(code="RW", label="Right Winger"),
            "LW": Position.objects.create(code="LW", label="Left Winger"),
            "ST": Position.objects.create(code="ST", label="Striker"),
        }

        club1 = Club.objects.create(name="Al Wehdat", country="Jordan")
        club2 = Club.objects.create(name="Real Betis", country="Spain")
        club3 = Club.objects.create(name="Wydad", country="Morocco")
        club4 = Club.objects.create(name="Montpellier", country="France")

        season = Season.objects.create(
            label="2025/26",
            start_date=date(2025, 8, 1),
            end_date=date(2026, 6, 30),
        )
        competition = Competition.objects.create(name="World Cup Qualifier")

        p1 = Player.objects.create(
            name="Yazan Al Naimat",
            team=jordan,
            current_club=club1,
            primary_position=positions["ST"],
            status="INJ",
            overall_rating=82,
            pace=79,
            passing=67,
            stamina=72,
            recent_form_index=78,
            fitness_score=58,
            minutes_last_5=342,
            goal_contribution_rate=0.61,
        )
        p2 = Player.objects.create(
            name="Mahmoud Al Mardi",
            team=jordan,
            current_club=club2,
            primary_position=positions["AM"],
            status="FIT",
            overall_rating=79,
            pace=81,
            passing=73,
            stamina=75,
            recent_form_index=76,
            fitness_score=84,
            minutes_last_5=390,
            goal_contribution_rate=0.48,
        )
        p3 = Player.objects.create(
            name="Nizar Al Rashdan",
            team=jordan,
            current_club=club3,
            primary_position=positions["CM"],
            status="FIT",
            overall_rating=77,
            pace=64,
            passing=78,
            stamina=80,
            recent_form_index=74,
            fitness_score=87,
            minutes_last_5=410,
            goal_contribution_rate=0.36,
        )
        p4 = Player.objects.create(
            name="Ali Olwan",
            team=jordan,
            current_club=club1,
            primary_position=positions["ST"],
            status="FIT",
            overall_rating=80,
            pace=77,
            passing=69,
            stamina=74,
            recent_form_index=80,
            fitness_score=86,
            minutes_last_5=395,
            goal_contribution_rate=0.52,
        )
        p5 = Player.objects.create(
            name="Yazeed Abu Laila",
            team=jordan,
            current_club=club1,
            primary_position=positions["GK"],
            status="FIT",
            overall_rating=81,
            pace=45,
            passing=72,
            stamina=78,
            recent_form_index=83,
            fitness_score=88,
            minutes_last_5=450,
            goal_contribution_rate=0.05,
        )
        p6 = Player.objects.create(
            name="Ehsan Haddad",
            team=jordan,
            current_club=club1,
            primary_position=positions["RB"],
            status="FIT",
            overall_rating=76,
            pace=70,
            passing=71,
            stamina=77,
            recent_form_index=75,
            fitness_score=82,
            minutes_last_5=360,
            goal_contribution_rate=0.18,
        )
        p7 = Player.objects.create(
            name="Yazan Al Arab",
            team=jordan,
            current_club=club3,
            primary_position=positions["CB"],
            status="FIT",
            overall_rating=80,
            pace=62,
            passing=73,
            stamina=83,
            recent_form_index=82,
            fitness_score=84,
            minutes_last_5=420,
            goal_contribution_rate=0.22,
        )
        p8 = Player.objects.create(
            name="Abdallah Nasib",
            team=jordan,
            current_club=club1,
            primary_position=positions["CB"],
            status="FIT",
            overall_rating=78,
            pace=59,
            passing=69,
            stamina=81,
            recent_form_index=79,
            fitness_score=80,
            minutes_last_5=390,
            goal_contribution_rate=0.19,
        )
        p9 = Player.objects.create(
            name="Ibrahim Sadeh",
            team=jordan,
            current_club=club1,
            primary_position=positions["LB"],
            status="FIT",
            overall_rating=77,
            pace=76,
            passing=75,
            stamina=84,
            recent_form_index=78,
            fitness_score=85,
            minutes_last_5=402,
            goal_contribution_rate=0.24,
        )
        p10 = Player.objects.create(
            name="Mousa Al Tamari",
            team=jordan,
            current_club=club4,
            primary_position=positions["RW"],
            status="FIT",
            overall_rating=88,
            pace=91,
            passing=82,
            stamina=86,
            recent_form_index=90,
            fitness_score=91,
            minutes_last_5=430,
            goal_contribution_rate=0.72,
        )
        p11 = Player.objects.create(
            name="Ali Khalil",
            team=jordan,
            current_club=club1,
            primary_position=positions["LW"],
            status="FIT",
            overall_rating=75,
            pace=80,
            passing=70,
            stamina=79,
            recent_form_index=74,
            fitness_score=81,
            minutes_last_5=355,
            goal_contribution_rate=0.31,
        )
        p12 = Player.objects.create(
            name="Samer Saleh",
            team=jordan,
            current_club=club1,
            primary_position=positions["DM"],
            status="FIT",
            overall_rating=74,
            pace=66,
            passing=75,
            stamina=82,
            recent_form_index=73,
            fitness_score=80,
            minutes_last_5=340,
            goal_contribution_rate=0.22,
        )

        p2.secondary_positions.add(positions["RW"], positions["CM"])
        p3.secondary_positions.add(positions["DM"])
        p10.secondary_positions.add(positions["LW"], positions["AM"])
        p11.secondary_positions.add(positions["ST"])

        InjuryStatus.objects.create(
            player=p1,
            injury_name="Hamstring strain",
            severity="moderate",
            start_date=date.today() - timedelta(days=3),
            expected_return_date=date.today() + timedelta(days=12),
            is_active=True,
        )

        match = Match.objects.create(
            competition=competition,
            season=season,
            home_team=jordan,
            away_team=spain,
            date=date.today() - timedelta(days=7),
            goals_for=1,
            goals_against=2,
        )
        future_match = Match.objects.create(
            competition=competition,
            season=season,
            home_team=jordan,
            away_team=morocco,
            date=date.today() + timedelta(days=5),
            goals_for=0,
            goals_against=0,
        )

        PlayerMatchStat.objects.create(player=p2, match=match, minutes_played=90, distance_covered_km=10.40, pass_accuracy_percent=82.1, rating=7.4, goals=1, assists=0)
        PlayerMatchStat.objects.create(player=p3, match=match, minutes_played=90, distance_covered_km=11.10, pass_accuracy_percent=86.7, rating=7.2, goals=0, assists=1)
        PlayerMatchStat.objects.create(player=p4, match=match, minutes_played=76, distance_covered_km=8.90, pass_accuracy_percent=78.3, rating=7.0, goals=0, assists=0)
        PlayerMatchStat.objects.create(player=p10, match=match, minutes_played=90, distance_covered_km=10.90, pass_accuracy_percent=84.1, rating=8.2, goals=1, assists=1)
        PlayerMatchStat.objects.create(player=p5, match=match, minutes_played=90, distance_covered_km=4.80, pass_accuracy_percent=74.0, rating=7.1, goals=0, assists=0)

        OpponentProfile.objects.create(
            team=spain,
            tactical_style="Positional build-up with high fullbacks",
            strengths=["Central overloads", "Fast wing switches"],
            weaknesses=["Space behind fullbacks", "Counter transition after ball loss"],
        )
        OpponentProfile.objects.create(
            team=morocco,
            tactical_style="High press with compact midfield block",
            strengths=["Ball recovery in middle third", "Fast wing transitions"],
            weaknesses=["Space behind fullbacks", "Set-piece second-ball coverage"],
        )

        RecommendationSnapshot.objects.create(position=positions["ST"], player=p4, rank_score=86.4, confidence=0.81, why_recommended=["High recent form", "Strong off-ball movement"], risk_flags=[], run_label="seed")
        RecommendationSnapshot.objects.create(position=positions["RW"], player=p10, rank_score=92.7, confidence=0.92, why_recommended=["Elite dribbling", "Strong recent output"], risk_flags=[], run_label="seed")
        RecommendationSnapshot.objects.create(position=positions["CM"], player=p3, rank_score=79.8, confidence=0.87, why_recommended=["Midfield control", "Press resistance"], risk_flags=[], run_label="seed")
        RecommendationSnapshot.objects.create(position=positions["GK"], player=p5, rank_score=81.1, confidence=0.88, why_recommended=["Reliable saves", "Distribution"], risk_flags=[], run_label="seed")
        RecommendationSnapshot.objects.create(position=positions["CB"], player=p7, rank_score=83.5, confidence=0.84, why_recommended=["Aerial strength", "Backline leadership"], risk_flags=[], run_label="seed")

        ReplacementDecision.objects.create(
            injured_player=p1,
            replacement_player=p4,
            position=positions["ST"],
            notes="Default injury replacement decision from seed run.",
            is_active=True,
        )

        self.stdout.write(self.style.NOTICE(f"Seeded match IDs: past={match.id}, next={future_match.id}"))

        self.stdout.write(self.style.SUCCESS("Demo dataset reset complete."))
