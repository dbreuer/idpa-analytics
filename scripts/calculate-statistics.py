from __future__ import annotations

from collections import defaultdict
from math import sqrt

from common import COMPETITIONS_PATH, RESULTS_PATH, STATISTICS_PATH, load_json, now_iso, save_json


def average(values: list[float]) -> float | None:
    return sum(values) / len(values) if values else None


def median(values: list[float]) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    mid = len(ordered) // 2
    if len(ordered) % 2 == 0:
        return (ordered[mid - 1] + ordered[mid]) / 2
    return ordered[mid]


def standard_deviation(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = average(values) or 0.0
    return sqrt(sum((value - mean) ** 2 for value in values) / len(values))


def placement_points(placement: int | None) -> float:
    points = {1: 100, 2: 80, 3: 65, 4: 50, 5: 40, 6: 35, 7: 30, 8: 26, 9: 22, 10: 18}
    if not placement:
        return 0.0
    if placement in points:
        return points[placement]
    return max(0.0, 18 - max(0, placement - 10) * 1.5)


def main() -> None:
    competitions_file = load_json(COMPETITIONS_PATH, {"competitions": []})
    results_file = load_json(RESULTS_PATH, {"results": []})
    competitions = competitions_file.get("competitions", [])
    results = results_file.get("results", [])

    fastest_by_competition: dict[str, float] = {}
    for result in results:
        time_seconds = result.get("timeSeconds")
        if time_seconds is None:
            continue
        competition_id = result.get("competitionId")
        if competition_id not in fastest_by_competition or time_seconds < fastest_by_competition[competition_id]:
            fastest_by_competition[competition_id] = time_seconds

    competitors: dict[str, dict] = defaultdict(lambda: {
        "entries": 0,
        "competitionIds": set(),
        "placements": [],
        "wins": 0,
        "podiums": 0,
        "times": [],
        "normalizedSpeedValues": [],
        "divisions": set(),
    })

    for result in results:
        key = result.get("normalizedCompetitorName") or result.get("competitorName")
        entry = competitors[key]
        entry["competitorName"] = result.get("competitorName")
        entry["club"] = result.get("normalizedClub") or result.get("club")
        entry["entries"] += 1
        entry["competitionIds"].add(result.get("competitionId"))
        placement = result.get("placement")
        if placement is not None:
            entry["placements"].append(placement)
            if placement == 1:
                entry["wins"] += 1
            if placement <= 3:
                entry["podiums"] += 1
        if result.get("division"):
            entry["divisions"].add(result.get("division"))
        if result.get("timeSeconds") is not None:
            entry["times"].append(result["timeSeconds"])
            fastest = fastest_by_competition.get(result.get("competitionId"))
            if fastest:
                entry["normalizedSpeedValues"].append(fastest / result["timeSeconds"])

    competitor_list = []
    for key, value in competitors.items():
        placements = value["placements"]
        unique_competitions = len(value["competitionIds"])
        performance = sum(placement_points(placement) for placement in placements)
        participation = min(unique_competitions * 10, 45)
        consistency = max(0.0, 40 - standard_deviation(placements) * 10) + max(0.0, (1 - min(((average(placements) or 99) - 1) / 15, 1)) * 15)
        overall = performance + participation + value["wins"] * 16 + value["podiums"] * 5 + consistency
        competitor_list.append({
            "competitorName": value.get("competitorName"),
            "normalizedCompetitorName": key,
            "club": value.get("club"),
            "entries": value["entries"],
            "uniqueCompetitions": unique_competitions,
            "wins": value["wins"],
            "podiums": value["podiums"],
            "averagePlacement": average(placements),
            "medianPlacement": median(placements),
            "placementStdDev": standard_deviation(placements),
            "top10Rate": len([placement for placement in placements if placement <= 10]) / len(placements) if placements else 0,
            "podiumRate": value["podiums"] / len(placements) if placements else 0,
            "fastestTime": min(value["times"]) if value["times"] else None,
            "averageTime": average(value["times"]),
            "normalizedSpeedScore": average(value["normalizedSpeedValues"]),
            "overallScore": round(overall, 2),
            "consistencyScore": round(consistency, 2),
            "divisionSet": sorted(value["divisions"]),
        })

    competitor_list.sort(key=lambda item: item["overallScore"], reverse=True)

    clubs: dict[str, dict] = defaultdict(lambda: {"scores": [], "wins": 0, "podiums": 0, "placements": [], "members": 0, "appearances": 0})
    for competitor in competitor_list:
        club = competitor.get("club")
        if not club:
            continue
        entry = clubs[club]
        entry["scores"].append(competitor["overallScore"])
        entry["wins"] += competitor["wins"]
        entry["podiums"] += competitor["podiums"]
        entry["members"] += 1
        entry["appearances"] += competitor["entries"]
        if competitor.get("averagePlacement") is not None:
            entry["placements"].append(competitor["averagePlacement"])

    club_list = []
    for club, value in clubs.items():
        scores = sorted(value["scores"], reverse=True)
        club_list.append({
            "club": club,
            "members": value["members"],
            "appearances": value["appearances"],
            "wins": value["wins"],
            "podiums": value["podiums"],
            "averagePlacement": average(value["placements"]),
            "powerScore": round(sum(scores[:5]), 2),
            "strengthScore": round(average(scores) or 0.0, 2),
            "topCompetitor": next((competitor["competitorName"] for competitor in competitor_list if competitor.get("club") == club), None),
            "bestDivision": next((division for competitor in competitor_list if competitor.get("club") == club for division in competitor.get("divisionSet", [])), None),
        })
    club_list.sort(key=lambda item: item["powerScore"], reverse=True)

    statistics = {
        "totalCompetitions": len(competitions),
        "uniqueCompetitors": len(competitor_list),
        "clubs": len(club_list),
        "totalEntries": len(results),
        "fastestRecordedTime": min((result.get("timeSeconds") for result in results if result.get("timeSeconds") is not None), default=None),
        "mostActiveCompetitor": competitor_list[0]["competitorName"] if competitor_list else None,
        "competitors": competitor_list,
        "overallTop5": competitor_list[:5],
        "speedTop5": sorted([item for item in competitor_list if item.get("normalizedSpeedScore") is not None], key=lambda item: item["normalizedSpeedScore"], reverse=True)[:5],
        "ironmanTop5": sorted(competitor_list, key=lambda item: (item["uniqueCompetitions"], item["overallScore"]), reverse=True)[:5],
        "consistencyTop5": sorted([item for item in competitor_list if item["uniqueCompetitions"] >= 3], key=lambda item: item["consistencyScore"], reverse=True)[:5],
        "clubsRanking": club_list,
        "divisions": [],
        "competitions": [],
        "insights": {
            "dominator": competitor_list[0]["competitorName"] if competitor_list else None,
            "speedDemon": sorted([item for item in competitor_list if item.get("normalizedSpeedScore") is not None], key=lambda item: item["normalizedSpeedScore"], reverse=True)[0]["competitorName"] if any(item.get("normalizedSpeedScore") is not None for item in competitor_list) else None,
            "ironman": sorted(competitor_list, key=lambda item: (item["uniqueCompetitions"], item["overallScore"]), reverse=True)[0]["competitorName"] if competitor_list else None,
            "mrConsistent": sorted([item for item in competitor_list if item["uniqueCompetitions"] >= 3], key=lambda item: item["consistencyScore"], reverse=True)[0]["competitorName"] if any(item["uniqueCompetitions"] >= 3 for item in competitor_list) else None,
            "risingStar": None,
            "biggestCompetition": None,
            "strongestClub": club_list[0]["club"] if club_list else None,
            "podiumMachine": sorted(competitor_list, key=lambda item: item["podiumRate"], reverse=True)[0]["competitorName"] if competitor_list else None,
        },
    }

    save_json(STATISTICS_PATH, {"generatedAt": now_iso(), "statistics": statistics, "errors": []})


if __name__ == "__main__":
    main()
