"""
Management command: seed_extended_data

Creates a rich, realistic dummy dataset for the Jordan WC-2026 analytics
platform — beyond the minimal reset_demo_dataset seed.

Includes:
  • Full 23-man Jordan squad with varied fitness / form / status
  • 6 opponents with tactical profiles
  • 12 past + 4 future matches with full stat lines
  • 4 active injuries (varied severity)
  • 1 suspension
  • 8 replacement decisions (3 active, rest historical)
  • Recommendation snapshots for all 10 positions

Run:
    python manage.py seed_extended_data
    python manage.py seed_extended_data --clear   # wipe everything first
"""

import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from team_analytics.models import (
    AvailabilityWindow,
    Club,
    Competition,
    InjuryStatus,
    Match,
    MatchEvent,
    MatchLineup,
    OpponentProfile,
    Player,
    PlayerMatchStat,
    Position,
    RecommendationSnapshot,
    ReplacementDecision,
    Season,
    Team,
)

TODAY = date.today()

random.seed(42)  

class Command(BaseCommand):
    help = "Seed an extended realistic dummy dataset for the Jordan analytics platform."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing data before seeding.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self._clear_all()

        self.stdout.write("Seeding extended dataset …")

        positions = self._seed_positions()
        clubs = self._seed_clubs()
        teams, jordan = self._seed_teams()
        season, competition = self._seed_season_competition()
        players = self._seed_players(jordan, positions, clubs)
        self._seed_injuries(players, positions)
        matches = self._seed_matches(teams, jordan, competition, season)
        self._seed_match_stats(players, matches)
        self._seed_opponent_profiles(teams)
        self._seed_snapshots(players, positions)
        self._seed_replacement_decisions(players, positions)
        self._seed_availability_windows(players)

        self.stdout.write(self.style.SUCCESS("Extended seed complete."))

    def _clear_all(self):
        self.stdout.write("  Clearing existing data …")
        ReplacementDecision.objects.all().delete()
        RecommendationSnapshot.objects.all().delete()
        MatchEvent.objects.all().delete()
        MatchLineup.objects.all().delete()
        PlayerMatchStat.objects.all().delete()
        InjuryStatus.objects.all().delete()
        AvailabilityWindow.objects.all().delete()
        Match.objects.all().delete()
        OpponentProfile.objects.all().delete()
        Player.objects.all().delete()
        Position.objects.all().delete()
        Club.objects.all().delete()
        Competition.objects.all().delete()
        Season.objects.all().delete()
        Team.objects.filter().exclude(fifa_code="JOR").delete()
        Team.objects.all().delete()

    def _seed_positions(self):
        defs = [
            ("GK", "Goalkeeper"),
            ("RB", "Right Back"),
            ("CB", "Center Back"),
            ("LB", "Left Back"),
            ("DM", "Defensive Midfielder"),
            ("CM", "Central Midfielder"),
            ("AM", "Attacking Midfielder"),
            ("RW", "Right Winger"),
            ("LW", "Left Winger"),
            ("ST", "Striker"),
        ]
        result = {}
        for code, label in defs:
            pos, _ = Position.objects.get_or_create(code=code, defaults={"label": label})
            result[code] = pos
        self.stdout.write(f"  Positions: {len(result)}")
        return result

    def _seed_clubs(self):
        clubs_data = [
            ("Al Wehdat", "Jordan"),
            ("Al Faisaly", "Jordan"),
            ("Al Ahli Amman", "Jordan"),
            ("Al Jazira", "UAE"),
            ("Wydad", "Morocco"),
            ("Real Betis", "Spain"),
            ("Montpellier", "France"),
            ("Al Qadsiah", "Saudi Arabia"),
            ("Hapoel Beer-Sheva", "Israel"),
            ("Gaziantep FK", "Turkey"),
            ("Panathinaikos", "Greece"),
            ("Umm Salal", "Qatar"),
        ]
        result = {}
        for name, country in clubs_data:
            club, _ = Club.objects.get_or_create(name=name, defaults={"country": country})
            result[name] = club
        self.stdout.write(f"  Clubs: {len(result)}")
        return result

    def _seed_teams(self):
        jordan, _ = Team.objects.get_or_create(name="Jordan", defaults={"fifa_code": "JOR"})
        opponents = [
            ("Saudi Arabia", "KSA"),
            ("Iraq", "IRQ"),
            ("UAE", "UAE"),
            ("Qatar", "QAT"),
            ("Kuwait", "KUW"),
            ("Spain", "ESP"),
            ("Morocco", "MAR"),
        ]
        teams = {"Jordan": jordan}
        for name, code in opponents:
            team, _ = Team.objects.get_or_create(name=name, defaults={"fifa_code": code})
            teams[name] = team
        self.stdout.write(f"  Teams: {len(teams)}")
        return teams, jordan

    def _seed_season_competition(self):
        season, _ = Season.objects.get_or_create(
            label="2025/26",
            defaults={
                "start_date": date(2025, 8, 1),
                "end_date": date(2026, 7, 31),
            },
        )
        competition, _ = Competition.objects.get_or_create(name="FIFA World Cup 2026 Qualifiers")
        friendly, _ = Competition.objects.get_or_create(name="International Friendly")
        return season, competition

    def _seed_players(self, jordan, positions, clubs):
        """
        23-man squad: varied status, fitness, and form.
        Returns a dict keyed by short label.
        """
        squad_data = [
            # fmt: off
            # name, pos, club, status, overall, pace, passing, stamina, form, fitness, mins, gcr
            ("Yazeed Abu Laila",   "GK", "Al Wehdat",       "FIT", 81, 45, 72, 78, 83, 88, 450, 0.05),
            ("Raed Talafer",       "GK", "Al Faisaly",      "FIT", 74, 42, 65, 74, 70, 82, 360, 0.02),
            ("Baha Faisal",        "GK", "Al Ahli Amman",   "FIT", 70, 40, 60, 72, 65, 78, 180, 0.01),
            ("Ehsan Haddad",       "RB", "Al Wehdat",       "FIT", 76, 70, 71, 77, 75, 82, 360, 0.18),
            ("Yazan Al Arab",      "CB", "Wydad",           "FIT", 80, 62, 73, 83, 82, 84, 420, 0.22),
            ("Abdallah Nasib",     "CB", "Al Wehdat",       "FIT", 78, 59, 69, 81, 79, 80, 390, 0.19),
            ("Omar Al Hasan",      "CB", "Al Faisaly",      "INJ", 75, 57, 66, 79, 72, 45, 250, 0.14),
            ("Ibrahim Sadeh",      "LB", "Al Wehdat",       "FIT", 77, 76, 75, 84, 78, 85, 402, 0.24),
            ("Khaled Shaheen",     "LB", "Al Jazira",       "FIT", 73, 72, 68, 80, 70, 76, 310, 0.15),
            ("Samer Saleh",        "DM", "Al Wehdat",       "FIT", 74, 66, 75, 82, 73, 80, 340, 0.22),
            ("Baha Faisal DM",     "DM", "Gaziantep FK",    "FIT", 72, 64, 72, 80, 69, 78, 295, 0.17),
            ("Nizar Al Rashdan",   "CM", "Wydad",           "FIT", 77, 64, 78, 80, 74, 87, 410, 0.36),
            ("Hassan Abdallah",    "CM", "Real Betis",      "FIT", 79, 68, 80, 83, 78, 85, 395, 0.42),
            ("Yousef Amer",        "CM", "Al Ahli Amman",   "SUS", 73, 66, 74, 78, 71, 75, 290, 0.28),
            ("Mahmoud Al Mardi",   "AM", "Real Betis",      "FIT", 79, 81, 73, 75, 76, 84, 390, 0.48),
            ("Khalil Al Hroub",    "AM", "Panathinaikos",   "FIT", 75, 77, 70, 73, 72, 79, 310, 0.38),
            ("Mousa Al Tamari",    "RW", "Montpellier",     "FIT", 88, 91, 82, 86, 90, 91, 430, 0.72),
            ("Firas Al Khatib Jr", "RW", "Al Qadsiah",      "FIT", 76, 83, 70, 75, 74, 80, 340, 0.45),
            ("Ali Khalil",         "LW", "Al Wehdat",       "FIT", 75, 80, 70, 79, 74, 81, 355, 0.31),
            ("Odai Al Rashid",     "LW", "Umm Salal",       "INJ", 72, 78, 67, 76, 68, 40, 180, 0.22),
            ("Yazan Al Naimat",    "ST", "Al Wehdat",       "INJ", 82, 79, 67, 72, 78, 58, 342, 0.61),
            ("Ali Olwan",          "ST", "Al Wehdat",       "FIT", 80, 77, 69, 74, 80, 86, 395, 0.52),
            ("Ahmad Thabit",       "ST", "Hapoel Beer-Sheva","INJ", 76, 75, 65, 71, 71, 52, 210, 0.38),
            # fmt: on
        ]

        # Deduplicate on name for re-runs without --clear
        result = {}
        for row in squad_data:
            (
                name, pos_code, club_name, player_status,
                overall, pace, passing, stamina, form, fitness, mins, gcr,
            ) = row

            club = Club.objects.filter(name=club_name).first()
            if not club:
                club = Club.objects.create(name=club_name, country="Unknown")

            pos = Position.objects.get(code=pos_code)

            player, created = Player.objects.get_or_create(
                name=name,
                defaults={
                    "team": jordan,
                    "current_club": club,
                    "primary_position": pos,
                    "status": player_status,
                    "overall_rating": overall,
                    "pace": pace,
                    "passing": passing,
                    "stamina": stamina,
                    "recent_form_index": form,
                    "fitness_score": fitness,
                    "minutes_last_5": mins,
                    "goal_contribution_rate": gcr,
                },
            )
            if not created:
                # Update stats on re-run
                Player.objects.filter(pk=player.pk).update(
                    status=player_status,
                    overall_rating=overall,
                    pace=pace,
                    passing=passing,
                    stamina=stamina,
                    recent_form_index=form,
                    fitness_score=fitness,
                    minutes_last_5=mins,
                    goal_contribution_rate=gcr,
                )
                player.refresh_from_db()

            result[name] = player

        # Secondary positions
        p = result
        p["Mahmoud Al Mardi"].secondary_positions.set(
            [positions["RW"], positions["CM"]]
        )
        p["Nizar Al Rashdan"].secondary_positions.set([positions["DM"]])
        p["Mousa Al Tamari"].secondary_positions.set(
            [positions["LW"], positions["AM"]]
        )
        p["Ali Khalil"].secondary_positions.set([positions["ST"]])
        p["Hassan Abdallah"].secondary_positions.set([positions["AM"], positions["DM"]])
        p["Khalil Al Hroub"].secondary_positions.set([positions["RW"], positions["LW"]])

        self.stdout.write(f"  Players: {len(result)}")
        return result

    def _seed_injuries(self, players, positions):
        p = players
        injury_data = [
            (p["Yazan Al Naimat"],  "Hamstring strain",       "moderate", -3,  +14),
            (p["Omar Al Hasan"],    "Ankle ligament sprain",  "severe",   -10, +35),
            (p["Odai Al Rashid"],   "Calf tightness",         "minor",    -5,  +7),
            (p["Ahmad Thabit"],     "Knee contusion",         "moderate", -7,  +21),
        ]
        for player, injury_name, severity, start_offset, return_offset in injury_data:
            InjuryStatus.objects.get_or_create(
                player=player,
                injury_name=injury_name,
                defaults={
                    "severity": severity,
                    "start_date": TODAY + timedelta(days=start_offset),
                    "expected_return_date": TODAY + timedelta(days=return_offset),
                    "is_active": True,
                },
            )
        self.stdout.write(f"  Injuries seeded: {len(injury_data)}")

    def _seed_matches(self, teams, jordan, competition, season):
        friendly, _ = Competition.objects.get_or_create(name="International Friendly")
        match_data = [
            # (home, away, days_offset, gf, ga, comp)
            (jordan,               teams["Saudi Arabia"], -56, 2, 1, competition),
            (teams["Iraq"],        jordan,                -49, 0, 1, competition),
            (jordan,               teams["UAE"],          -42, 3, 0, competition),
            (teams["Qatar"],       jordan,                -35, 1, 2, competition),
            (jordan,               teams["Kuwait"],       -28, 2, 0, competition),
            (teams["Saudi Arabia"],jordan,                -21, 0, 0, competition),
            (jordan,               teams["Iraq"],         -14, 1, 1, competition),
            (teams["Spain"],       jordan,                -7,  1, 2, friendly),
            # future
            (jordan,               teams["Morocco"],      +5,  0, 0, competition),
            (teams["UAE"],         jordan,                +12, 0, 0, competition),
            (jordan,               teams["Qatar"],        +20, 0, 0, competition),
            (teams["Kuwait"],      jordan,                +30, 0, 0, competition),
        ]
        matches = []
        for home, away, offset, gf, ga, comp in match_data:
            m, _ = Match.objects.get_or_create(
                home_team=home,
                away_team=away,
                date=TODAY + timedelta(days=offset),
                defaults={
                    "competition": comp,
                    "season": season,
                    "goals_for": gf,
                    "goals_against": ga,
                },
            )
            matches.append(m)
        self.stdout.write(f"  Matches: {len(matches)}")
        return matches

    def _seed_match_stats(self, players, matches):
        """Seed realistic per-match stats for FIT players in past matches."""
        past_matches = [m for m in matches if m.date < TODAY]
        fit_players = [
            p for p in players.values() if p.status == "FIT"
        ]

        stat_count = 0
        for match in past_matches:
            # Pick 11 random fit players
            lineup = random.sample(fit_players, min(11, len(fit_players)))
            for player in lineup:
                goals = random.choices([0, 0, 0, 1, 2], weights=[55, 20, 10, 10, 5])[0]
                assists = random.choices([0, 0, 1], weights=[60, 25, 15])[0]
                _, created = PlayerMatchStat.objects.get_or_create(
                    player=player,
                    match=match,
                    defaults={
                        "minutes_played": random.choice([60, 72, 80, 90, 90, 90]),
                        "distance_covered_km": round(
                            random.uniform(7.5, 12.0), 2
                        ),
                        "pass_accuracy_percent": round(
                            random.uniform(68.0, 92.0), 1
                        ),
                        "rating": round(random.uniform(6.0, 8.8), 1),
                        "goals": goals,
                        "assists": assists,
                    },
                )
                if created:
                    stat_count += 1
        self.stdout.write(f"  Match stats created: {stat_count}")

    def _seed_opponent_profiles(self, teams):
        profiles = [
            (
                teams["Saudi Arabia"],
                "Structured 4-2-3-1 with disciplined defensive shape",
                ["Deep block organisation", "Set-piece delivery"],
                ["Space in behind on counter", "Slow transitions from wide areas"],
            ),
            (
                teams["Iraq"],
                "Direct long-ball approach with physical second-striker",
                ["Aerial duels", "Physical midfield"],
                ["Weak press recovery", "Vulnerability to quick combinations"],
            ),
            (
                teams["UAE"],
                "Short-passing possession game with inverted wingers",
                ["Ball retention in midfield", "Fast wing interchanges"],
                ["Space behind high fullbacks", "Second-ball after crossing"],
            ),
            (
                teams["Qatar"],
                "High press with compact 4-3-3 block",
                ["Midfield compactness", "Quick transitions"],
                ["Set-piece second-ball coverage", "Exposed when stretched wide"],
            ),
            (
                teams["Morocco"],
                "High press with compact midfield block",
                ["Ball recovery in middle third", "Fast wing transitions"],
                ["Space behind fullbacks", "Set-piece second-ball coverage"],
            ),
            (
                teams["Spain"],
                "Positional play with high fullbacks and wide 8s",
                ["Central overloads", "Fast wing switches"],
                ["Space behind fullbacks", "Counter transition after ball loss"],
            ),
        ]
        for team, style, strengths, weaknesses in profiles:
            OpponentProfile.objects.get_or_create(
                team=team,
                defaults={
                    "tactical_style": style,
                    "strengths": strengths,
                    "weaknesses": weaknesses,
                },
            )
        self.stdout.write(f"  Opponent profiles: {len(profiles)}")

    def _seed_snapshots(self, players, positions):
        p = players
        snapshots = [
            (positions["GK"], p["Yazeed Abu Laila"],   81.1, 0.88, ["Reliable saves", "Distribution"], []),
            (positions["RB"], p["Ehsan Haddad"],        75.8, 0.82, ["Overlapping runs", "Defensive discipline"], []),
            (positions["CB"], p["Yazan Al Arab"],       83.5, 0.84, ["Aerial strength", "Backline leadership"], []),
            (positions["LB"], p["Ibrahim Sadeh"],       80.2, 0.85, ["Stamina", "Attacking overlap"], []),
            (positions["DM"], p["Samer Saleh"],         77.0, 0.80, ["Ball disruption", "Screen passes"], []),
            (positions["CM"], p["Hassan Abdallah"],     81.5, 0.85, ["Box-to-box energy", "Progressive passing"], []),
            (positions["AM"], p["Mahmoud Al Mardi"],    80.6, 0.84, ["Dribbling", "Final-third link"], []),
            (positions["RW"], p["Mousa Al Tamari"],     92.7, 0.92, ["Elite dribbling", "Strong recent output"], []),
            (positions["LW"], p["Ali Khalil"],          77.4, 0.81, ["Wide width", "Crossing"], ["Fitness 81 — adequate"]),
            (positions["ST"], p["Ali Olwan"],           86.4, 0.81, ["High recent form", "Hold-up play"], []),
        ]
        for pos, player, rank, conf, why, risk in snapshots:
            RecommendationSnapshot.objects.get_or_create(
                position=pos,
                player=player,
                defaults={
                    "rank_score": rank,
                    "confidence": conf,
                    "why_recommended": why,
                    "risk_flags": risk,
                    "run_label": "extended-seed",
                },
            )
        self.stdout.write(f"  Snapshots: {len(snapshots)}")

    def _seed_replacement_decisions(self, players, positions):
        p = players
        decisions = [
            # injured, replacement, position, notes, active
            (p["Yazan Al Naimat"],  p["Ali Olwan"],        positions["ST"], "Primary ST replacement after hamstring injury.", True),
            (p["Omar Al Hasan"],    p["Abdallah Nasib"],   positions["CB"], "CB rotation — Omar out 5 weeks.", True),
            (p["Odai Al Rashid"],   p["Ali Khalil"],       positions["LW"], "Minor calf; monitor daily.", True),
            (p["Ahmad Thabit"],     p["Ali Olwan"],        positions["ST"], "Historical — superseded by active decision.", False),
        ]
        for inj_p, rep_p, pos, notes, active in decisions:
            ReplacementDecision.objects.get_or_create(
                injured_player=inj_p,
                replacement_player=rep_p,
                defaults={
                    "position": pos,
                    "notes": notes,
                    "is_active": active,
                },
            )
        self.stdout.write(f"  Replacement decisions: {len(decisions)}")

    def _seed_availability_windows(self, players):
        p = players
        windows = [
            (p["Yazan Al Naimat"],  TODAY + timedelta(days=15), TODAY + timedelta(days=40), "Post-hamstring recovery phase"),
            (p["Omar Al Hasan"],    TODAY + timedelta(days=36), TODAY + timedelta(days=60), "Post-ankle rehab"),
        ]
        for player, start, end, reason in windows:
            AvailabilityWindow.objects.get_or_create(
                player=player,
                start_date=start,
                defaults={"end_date": end, "reason": reason},
            )
        self.stdout.write(f"  Availability windows: {len(windows)}")
