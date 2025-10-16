# External Data Sources

This document lists all external APIs and websites used by the football scraper to gather data.

## Primary Data Sources

### ESPN API
Base domain: `site.api.espn.com` and `sports.core.api.espn.com`

- **Injury Data**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries`
  - Used by: `InjuryTracker` class ([scripts/lib/injury-tracker.ts](scripts/lib/injury-tracker.ts))
  - Purpose: Fetches weekly injury reports for all NFL players
  - Limitations: Does not reliably track IR/season-ending injuries
  - Update frequency: Weekly before predictions are generated

- **Scoreboard/Schedule**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week={week}&year={year}`
  - Used by: [scripts/fetch-current-matchups.ts](scripts/fetch-current-matchups.ts), [scripts/collect-weekly-volume-stats.ts](scripts/collect-weekly-volume-stats.ts), [scripts/collect-weekly-touchdowns.ts](scripts/collect-weekly-touchdowns.ts)
  - Purpose: Fetches weekly NFL schedule and matchups
  - Data: Game IDs, team matchups, dates, scores

- **Game Summary/Box Score**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event={gameId}`
  - Used by: `ESPNGameFetcher` class ([scripts/lib/espn-game-fetcher.ts](scripts/lib/espn-game-fetcher.ts)), `SimpleTouchdownTracker` ([scripts/lib/simple-touchdown-tracker.ts](scripts/lib/simple-touchdown-tracker.ts)), `EnhancedPlayerStatsCollector` ([scripts/lib/enhanced-player-stats-collector.ts](scripts/lib/enhanced-player-stats-collector.ts))
  - Purpose: Detailed game data including player stats and touchdowns
  - Data: Play-by-play, scoring plays, player statistics

- **Team Rosters**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{teamId}/roster`
  - Used by: `PlayerValidator` ([scripts/lib/player-validator.ts](scripts/lib/player-validator.ts)), `DynamicPlayerValidator` ([scripts/lib/dynamic-player-validator.ts](scripts/lib/dynamic-player-validator.ts)), `PlayerTeamTracker` ([scripts/lib/player-team-tracker.ts](scripts/lib/player-team-tracker.ts))
  - Purpose: Validates players and confirms team rosters
  - Data: Current roster information, player positions

- **Teams List**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams`
  - Used by: `PlayerTeamTracker` ([scripts/lib/player-team-tracker.ts](scripts/lib/player-team-tracker.ts))
  - Purpose: Gets all NFL teams and their IDs
  - Data: Team names, IDs, abbreviations

- **Player Search**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes?limit=200&search={playerName}`
  - Used by: `PlayerValidator` ([scripts/lib/player-validator.ts](scripts/lib/player-validator.ts))
  - Purpose: Search for players by name
  - Data: Player IDs, teams, positions

- **Player Details**: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/{playerId}`
  - Used by: [scripts/check-player-status.ts](scripts/check-player-status.ts)
  - Purpose: Fetches individual player status and injury information
  - Limitations: Status field often shows "Day-To-Day" even for IR players

### Team Rankings
Base domain: `www.teamrankings.com`

- **Opponent Rushing TDs Allowed**: `https://www.teamrankings.com/nfl/stat/opponent-rushing-touchdowns-per-game`
  - Used by: [scripts/scrape-teamrankings.ts](scripts/scrape-teamrankings.ts)
  - Purpose: Team defense statistics for rushing TDs allowed
  - Data: Defense vulnerability to rushing touchdowns

- **Opponent Passing TDs Allowed**: `https://www.teamrankings.com/nfl/stat/opponent-passing-touchdowns-per-game`
  - Used by: [scripts/scrape-teamrankings.ts](scripts/scrape-teamrankings.ts)
  - Purpose: Team defense statistics for passing TDs allowed
  - Data: Defense vulnerability to passing touchdowns

- **Player Rushing TDs**: `https://www.teamrankings.com/nfl/player-stat/rushing-touchdowns`
  - Used by: [scripts/scrape-teamrankings.ts](scripts/scrape-teamrankings.ts)
  - Purpose: Current season rushing touchdown leaders
  - Data: Player rushing touchdown totals

- **Player Receiving TDs**: `https://www.teamrankings.com/nfl/player-stat/receiving-touchdowns`
  - Used by: [scripts/scrape-teamrankings.ts](scripts/scrape-teamrankings.ts)
  - Purpose: Current season receiving touchdown leaders
  - Data: Player receiving touchdown totals

- **Receiving Targets**: `https://www.teamrankings.com/nfl/player-stat/receiving-targeted`
  - Used by: [scripts/scrape-targets-data.ts](scripts/scrape-targets-data.ts), [scripts/scrape-real-targets.ts](scripts/scrape-real-targets.ts), [scripts/manual-real-data-entry.ts](scripts/manual-real-data-entry.ts), [scripts/auto-scrape-volume-data.ts](scripts/auto-scrape-volume-data.ts)
  - Purpose: Volume metrics - player receiving targets for volume-based predictions
  - Data: Target share, total targets per player

- **Season Schedule**: `https://www.teamrankings.com/nfl/schedules/season/`
  - Used by: [scripts/scrape-teamrankings.ts](scripts/scrape-teamrankings.ts)
  - Purpose: Weekly matchup information
  - Data: Game schedules, team matchups

### StatMuse
Base domain: `www.statmuse.com`

- **Historical Player TDs vs Opponent**: `https://www.statmuse.com/nfl/ask/{player}-{rushing|receiving}-touchdowns-vs-{opponent}-2024`
  - Used by: `DataFetcher` ([scripts/lib/data-fetcher.ts](scripts/lib/data-fetcher.ts))
  - Purpose: Historical touchdown data for specific player-opponent matchups
  - Data: Career TDs scored by a player against a specific opponent
  - Use case: Traditional prediction model historical analysis

### ESPN Stats (Web)
- **Receiving Stats**: `https://www.espn.com/nfl/stats/player/_/stat/receiving`
  - Used by: [scripts/auto-scrape-volume-data.ts](scripts/auto-scrape-volume-data.ts)
  - Purpose: Volume metrics for receiving (alternative source)
  - Data: Receiving targets, receptions, yards

### NFL.com Stats
- **Receiving Targets**: `https://www.nfl.com/stats/player-stats/category/receiving/2025/REG/all/receivingtargets/DESC`
  - Used by: [scripts/auto-scrape-volume-data.ts](scripts/auto-scrape-volume-data.ts)
  - Purpose: Official NFL receiving target statistics (alternative source)
  - Data: Official target counts per player

### Pro Football Reference
Base domain: `www.pro-football-reference.com`

- **Red Zone Data**: `https://www.pro-football-reference.com/` (specific endpoints TBD)
  - Used by: [scripts/scrape-pfr-redzone.ts](scripts/scrape-pfr-redzone.ts)
  - Purpose: Red zone usage statistics (targets and carries)
  - Data: Red zone targets for receivers, red zone carries for RBs
  - Note: Currently using hardcoded data; proper scraping implementation pending

## Supplementary Data

### Manual Data Files
- **IR List**: [data/manual-ir-list.json](data/manual-ir-list.json)
  - Purpose: Manually maintained list of players on IR/out for season that ESPN API misses
  - Merged with ESPN data during injury report generation
  - Updated manually as needed throughout the season
  - Structure: Player name, team, position, status, reason

## Data Flow Summary

### Weekly Update Process
1. **Injury Data**: `setup-injury-data.ts` → ESPN Injury API + Manual IR List → `data/injury-report.json`
2. **Matchups**: `fetch-current-matchups.ts` → ESPN Scoreboard API → `data/current-matchups.json`
3. **Defense Stats**: `scrape-teamrankings.ts` → Team Rankings → `data/team-defense-stats.json`
4. **Volume Stats**: Various scripts → Team Rankings/ESPN/NFL.com → `data/volume-stats.json`
5. **Red Zone**: `scrape-pfr-redzone.ts` → Pro Football Reference → Used in predictions
6. **Historical TDs**: On-demand during prediction generation → StatMuse → Used in traditional model

### Prediction Generation
- Combines all scraped data sources
- Filters out injured players using injury report
- Generates multiple prediction models (Traditional, ML, Volume, Combined, Enhanced)

## Notes

- ESPN's injury API is the primary source but requires manual supplementation for IR designations
- Team Rankings provides the most reliable defense-against-TD statistics
- StatMuse is used for historical matchup data in the traditional prediction model
- All API calls should be rate-limited and respectful of service terms
- Data is cached locally in the `data/` directory to minimize API calls
- Some sources (like Pro Football Reference red zone) are currently using static data pending proper scraping implementation
