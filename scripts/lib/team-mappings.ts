// Team name mappings for different data sources

// Team name mapping from full names to short names
export const TEAM_NAME_MAP: Record<string, string> = {
  "Philadelphia Eagles": "Philadelphia",
  "Dallas Cowboys": "Dallas", 
  "Kansas City Chiefs": "Kansas City",
  "Los Angeles Chargers": "LA Chargers",
  "Washington Commanders": "Washington",
  "New York Giants": "NY Giants",
  "Pittsburgh Steelers": "Pittsburgh",
  "New York Jets": "NY Jets",
  "New Orleans Saints": "New Orleans",
  "Arizona Cardinals": "Arizona",
  "New England Patriots": "New England",
  "Las Vegas Raiders": "Las Vegas",
  "Jacksonville Jaguars": "Jacksonville",
  "Miami Dolphins": "Miami",
  "Indianapolis Colts": "Indianapolis",
  "Cincinnati Bengals": "Cincinnati",
  "Cleveland Browns": "Cleveland",
  "Tampa Bay Buccaneers": "Tampa Bay",
  "Atlanta Falcons": "Atlanta",
  "San Francisco 49ers": "San Francisco",
  "Seattle Seahawks": "Seattle",
  "Tennessee Titans": "Tennessee",
  "Denver Broncos": "Denver",
  "Detroit Lions": "Detroit",
  "Green Bay Packers": "Green Bay",
  "Houston Texans": "Houston",
  "Los Angeles Rams": "LA Rams",
  "Baltimore Ravens": "Baltimore",
  "Buffalo Bills": "Buffalo",
  "Minnesota Vikings": "Minnesota",
  "Chicago Bears": "Chicago",
  "Carolina Panthers": "Carolina"
};

// StatMuse team name mapping for URLs
export const STATMUSE_TEAM_MAP: Record<string, string> = {
  "Philadelphia": "eagles",
  "Dallas": "cowboys",
  "Kansas City": "chiefs", 
  "LA Chargers": "chargers",
  "Washington": "commanders",
  "NY Giants": "giants",
  "Pittsburgh": "steelers",
  "NY Jets": "jets",
  "New Orleans": "saints",
  "Arizona": "cardinals",
  "New England": "patriots",
  "Las Vegas": "raiders",
  "Jacksonville": "jaguars",
  "Miami": "dolphins",
  "Indianapolis": "colts",
  "Cincinnati": "bengals",
  "Cleveland": "browns",
  "Tampa Bay": "buccaneers",
  "Atlanta": "falcons",
  "San Francisco": "49ers",
  "Seattle": "seahawks",
  "Tennessee": "titans",
  "Denver": "broncos",
  "Detroit": "lions",
  "Green Bay": "packers",
  "Houston": "texans",
  "LA Rams": "rams",
  "Baltimore": "ravens",
  "Buffalo": "bills",
  "Minnesota": "vikings",
  "Chicago": "bears",
  "Carolina": "panthers"
};

export function getShortTeamName(fullName: string): string {
  return TEAM_NAME_MAP[fullName] || fullName;
}

export function getStatMuseTeamName(shortName: string): string {
  return STATMUSE_TEAM_MAP[shortName] || shortName.toLowerCase();
}