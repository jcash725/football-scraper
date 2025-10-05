/**
 * Comprehensive Team Name Standardizer
 * Handles all variations of NFL team names found across different data sources
 */

export enum NFLTeam {
  // AFC East
  BUFFALO_BILLS = 'Buffalo Bills',
  MIAMI_DOLPHINS = 'Miami Dolphins',
  NEW_ENGLAND_PATRIOTS = 'New England Patriots',
  NEW_YORK_JETS = 'New York Jets',

  // AFC North
  BALTIMORE_RAVENS = 'Baltimore Ravens',
  CINCINNATI_BENGALS = 'Cincinnati Bengals',
  CLEVELAND_BROWNS = 'Cleveland Browns',
  PITTSBURGH_STEELERS = 'Pittsburgh Steelers',

  // AFC South
  HOUSTON_TEXANS = 'Houston Texans',
  INDIANAPOLIS_COLTS = 'Indianapolis Colts',
  JACKSONVILLE_JAGUARS = 'Jacksonville Jaguars',
  TENNESSEE_TITANS = 'Tennessee Titans',

  // AFC West
  DENVER_BRONCOS = 'Denver Broncos',
  KANSAS_CITY_CHIEFS = 'Kansas City Chiefs',
  LAS_VEGAS_RAIDERS = 'Las Vegas Raiders',
  LOS_ANGELES_CHARGERS = 'Los Angeles Chargers',

  // NFC East
  DALLAS_COWBOYS = 'Dallas Cowboys',
  NEW_YORK_GIANTS = 'New York Giants',
  PHILADELPHIA_EAGLES = 'Philadelphia Eagles',
  WASHINGTON_COMMANDERS = 'Washington Commanders',

  // NFC North
  CHICAGO_BEARS = 'Chicago Bears',
  DETROIT_LIONS = 'Detroit Lions',
  GREEN_BAY_PACKERS = 'Green Bay Packers',
  MINNESOTA_VIKINGS = 'Minnesota Vikings',

  // NFC South
  ATLANTA_FALCONS = 'Atlanta Falcons',
  CAROLINA_PANTHERS = 'Carolina Panthers',
  NEW_ORLEANS_SAINTS = 'New Orleans Saints',
  TAMPA_BAY_BUCCANEERS = 'Tampa Bay Buccaneers',

  // NFC West
  ARIZONA_CARDINALS = 'Arizona Cardinals',
  LOS_ANGELES_RAMS = 'Los Angeles Rams',
  SAN_FRANCISCO_49ERS = 'San Francisco 49ers',
  SEATTLE_SEAHAWKS = 'Seattle Seahawks'
}

// Comprehensive mapping of all possible team name variations to standardized names
const TEAM_NAME_VARIATIONS: Record<string, NFLTeam> = {
  // Buffalo Bills
  'buffalo': NFLTeam.BUFFALO_BILLS,
  'buffalo bills': NFLTeam.BUFFALO_BILLS,
  'bills': NFLTeam.BUFFALO_BILLS,

  // Miami Dolphins
  'miami': NFLTeam.MIAMI_DOLPHINS,
  'miami dolphins': NFLTeam.MIAMI_DOLPHINS,
  'dolphins': NFLTeam.MIAMI_DOLPHINS,

  // New England Patriots
  'new england': NFLTeam.NEW_ENGLAND_PATRIOTS,
  'new england patriots': NFLTeam.NEW_ENGLAND_PATRIOTS,
  'patriots': NFLTeam.NEW_ENGLAND_PATRIOTS,

  // New York Jets
  'new york jets': NFLTeam.NEW_YORK_JETS,
  'ny jets': NFLTeam.NEW_YORK_JETS,
  'jets': NFLTeam.NEW_YORK_JETS,

  // Baltimore Ravens
  'baltimore': NFLTeam.BALTIMORE_RAVENS,
  'baltimore ravens': NFLTeam.BALTIMORE_RAVENS,
  'ravens': NFLTeam.BALTIMORE_RAVENS,

  // Cincinnati Bengals
  'cincinnati': NFLTeam.CINCINNATI_BENGALS,
  'cincinnati bengals': NFLTeam.CINCINNATI_BENGALS,
  'bengals': NFLTeam.CINCINNATI_BENGALS,

  // Cleveland Browns
  'cleveland': NFLTeam.CLEVELAND_BROWNS,
  'cleveland browns': NFLTeam.CLEVELAND_BROWNS,
  'browns': NFLTeam.CLEVELAND_BROWNS,

  // Pittsburgh Steelers
  'pittsburgh': NFLTeam.PITTSBURGH_STEELERS,
  'pittsburgh steelers': NFLTeam.PITTSBURGH_STEELERS,
  'steelers': NFLTeam.PITTSBURGH_STEELERS,

  // Houston Texans
  'houston': NFLTeam.HOUSTON_TEXANS,
  'houston texans': NFLTeam.HOUSTON_TEXANS,
  'texans': NFLTeam.HOUSTON_TEXANS,

  // Indianapolis Colts
  'indianapolis': NFLTeam.INDIANAPOLIS_COLTS,
  'indianapolis colts': NFLTeam.INDIANAPOLIS_COLTS,
  'colts': NFLTeam.INDIANAPOLIS_COLTS,

  // Jacksonville Jaguars
  'jacksonville': NFLTeam.JACKSONVILLE_JAGUARS,
  'jacksonville jaguars': NFLTeam.JACKSONVILLE_JAGUARS,
  'jaguars': NFLTeam.JACKSONVILLE_JAGUARS,

  // Tennessee Titans
  'tennessee': NFLTeam.TENNESSEE_TITANS,
  'tennessee titans': NFLTeam.TENNESSEE_TITANS,
  'titans': NFLTeam.TENNESSEE_TITANS,

  // Denver Broncos
  'denver': NFLTeam.DENVER_BRONCOS,
  'denver broncos': NFLTeam.DENVER_BRONCOS,
  'broncos': NFLTeam.DENVER_BRONCOS,

  // Kansas City Chiefs
  'kansas city': NFLTeam.KANSAS_CITY_CHIEFS,
  'kansas city chiefs': NFLTeam.KANSAS_CITY_CHIEFS,
  'chiefs': NFLTeam.KANSAS_CITY_CHIEFS,

  // Las Vegas Raiders
  'las vegas': NFLTeam.LAS_VEGAS_RAIDERS,
  'las vegas raiders': NFLTeam.LAS_VEGAS_RAIDERS,
  'raiders': NFLTeam.LAS_VEGAS_RAIDERS,
  'oakland raiders': NFLTeam.LAS_VEGAS_RAIDERS, // Legacy name

  // Los Angeles Chargers
  'los angeles chargers': NFLTeam.LOS_ANGELES_CHARGERS,
  'la chargers': NFLTeam.LOS_ANGELES_CHARGERS,
  'chargers': NFLTeam.LOS_ANGELES_CHARGERS,
  'san diego chargers': NFLTeam.LOS_ANGELES_CHARGERS, // Legacy name

  // Dallas Cowboys
  'dallas': NFLTeam.DALLAS_COWBOYS,
  'dallas cowboys': NFLTeam.DALLAS_COWBOYS,
  'cowboys': NFLTeam.DALLAS_COWBOYS,

  // New York Giants
  'new york giants': NFLTeam.NEW_YORK_GIANTS,
  'ny giants': NFLTeam.NEW_YORK_GIANTS,
  'giants': NFLTeam.NEW_YORK_GIANTS,

  // Philadelphia Eagles
  'philadelphia': NFLTeam.PHILADELPHIA_EAGLES,
  'philadelphia eagles': NFLTeam.PHILADELPHIA_EAGLES,
  'eagles': NFLTeam.PHILADELPHIA_EAGLES,

  // Washington Commanders
  'washington': NFLTeam.WASHINGTON_COMMANDERS,
  'washington commanders': NFLTeam.WASHINGTON_COMMANDERS,
  'commanders': NFLTeam.WASHINGTON_COMMANDERS,
  'washington football team': NFLTeam.WASHINGTON_COMMANDERS, // Legacy name
  'washington redskins': NFLTeam.WASHINGTON_COMMANDERS, // Legacy name

  // Chicago Bears
  'chicago': NFLTeam.CHICAGO_BEARS,
  'chicago bears': NFLTeam.CHICAGO_BEARS,
  'bears': NFLTeam.CHICAGO_BEARS,

  // Detroit Lions
  'detroit': NFLTeam.DETROIT_LIONS,
  'detroit lions': NFLTeam.DETROIT_LIONS,
  'lions': NFLTeam.DETROIT_LIONS,

  // Green Bay Packers
  'green bay': NFLTeam.GREEN_BAY_PACKERS,
  'green bay packers': NFLTeam.GREEN_BAY_PACKERS,
  'packers': NFLTeam.GREEN_BAY_PACKERS,

  // Minnesota Vikings
  'minnesota': NFLTeam.MINNESOTA_VIKINGS,
  'minnesota vikings': NFLTeam.MINNESOTA_VIKINGS,
  'vikings': NFLTeam.MINNESOTA_VIKINGS,

  // Atlanta Falcons
  'atlanta': NFLTeam.ATLANTA_FALCONS,
  'atlanta falcons': NFLTeam.ATLANTA_FALCONS,
  'falcons': NFLTeam.ATLANTA_FALCONS,

  // Carolina Panthers
  'carolina': NFLTeam.CAROLINA_PANTHERS,
  'carolina panthers': NFLTeam.CAROLINA_PANTHERS,
  'panthers': NFLTeam.CAROLINA_PANTHERS,

  // New Orleans Saints
  'new orleans': NFLTeam.NEW_ORLEANS_SAINTS,
  'new orleans saints': NFLTeam.NEW_ORLEANS_SAINTS,
  'saints': NFLTeam.NEW_ORLEANS_SAINTS,

  // Tampa Bay Buccaneers
  'tampa bay': NFLTeam.TAMPA_BAY_BUCCANEERS,
  'tampa bay buccaneers': NFLTeam.TAMPA_BAY_BUCCANEERS,
  'buccaneers': NFLTeam.TAMPA_BAY_BUCCANEERS,
  'bucs': NFLTeam.TAMPA_BAY_BUCCANEERS,

  // Arizona Cardinals
  'arizona': NFLTeam.ARIZONA_CARDINALS,
  'arizona cardinals': NFLTeam.ARIZONA_CARDINALS,
  'cardinals': NFLTeam.ARIZONA_CARDINALS,

  // Los Angeles Rams
  'los angeles rams': NFLTeam.LOS_ANGELES_RAMS,
  'la rams': NFLTeam.LOS_ANGELES_RAMS,
  'rams': NFLTeam.LOS_ANGELES_RAMS,
  'st louis rams': NFLTeam.LOS_ANGELES_RAMS, // Legacy name

  // San Francisco 49ers
  'san francisco': NFLTeam.SAN_FRANCISCO_49ERS,
  'san francisco 49ers': NFLTeam.SAN_FRANCISCO_49ERS,
  '49ers': NFLTeam.SAN_FRANCISCO_49ERS,
  'niners': NFLTeam.SAN_FRANCISCO_49ERS,

  // Seattle Seahawks
  'seattle': NFLTeam.SEATTLE_SEAHAWKS,
  'seattle seahawks': NFLTeam.SEATTLE_SEAHAWKS,
  'seahawks': NFLTeam.SEATTLE_SEAHAWKS
};

// Short names for matchup display (used in data files)
const TEAM_SHORT_NAMES: Record<NFLTeam, string> = {
  [NFLTeam.BUFFALO_BILLS]: 'Buffalo',
  [NFLTeam.MIAMI_DOLPHINS]: 'Miami',
  [NFLTeam.NEW_ENGLAND_PATRIOTS]: 'New England',
  [NFLTeam.NEW_YORK_JETS]: 'NY Jets',
  [NFLTeam.BALTIMORE_RAVENS]: 'Baltimore',
  [NFLTeam.CINCINNATI_BENGALS]: 'Cincinnati',
  [NFLTeam.CLEVELAND_BROWNS]: 'Cleveland',
  [NFLTeam.PITTSBURGH_STEELERS]: 'Pittsburgh',
  [NFLTeam.HOUSTON_TEXANS]: 'Houston',
  [NFLTeam.INDIANAPOLIS_COLTS]: 'Indianapolis',
  [NFLTeam.JACKSONVILLE_JAGUARS]: 'Jacksonville',
  [NFLTeam.TENNESSEE_TITANS]: 'Tennessee',
  [NFLTeam.DENVER_BRONCOS]: 'Denver',
  [NFLTeam.KANSAS_CITY_CHIEFS]: 'Kansas City',
  [NFLTeam.LAS_VEGAS_RAIDERS]: 'Las Vegas',
  [NFLTeam.LOS_ANGELES_CHARGERS]: 'LA Chargers',
  [NFLTeam.DALLAS_COWBOYS]: 'Dallas',
  [NFLTeam.NEW_YORK_GIANTS]: 'NY Giants',
  [NFLTeam.PHILADELPHIA_EAGLES]: 'Philadelphia',
  [NFLTeam.WASHINGTON_COMMANDERS]: 'Washington',
  [NFLTeam.CHICAGO_BEARS]: 'Chicago',
  [NFLTeam.DETROIT_LIONS]: 'Detroit',
  [NFLTeam.GREEN_BAY_PACKERS]: 'Green Bay',
  [NFLTeam.MINNESOTA_VIKINGS]: 'Minnesota',
  [NFLTeam.ATLANTA_FALCONS]: 'Atlanta',
  [NFLTeam.CAROLINA_PANTHERS]: 'Carolina',
  [NFLTeam.NEW_ORLEANS_SAINTS]: 'New Orleans',
  [NFLTeam.TAMPA_BAY_BUCCANEERS]: 'Tampa Bay',
  [NFLTeam.ARIZONA_CARDINALS]: 'Arizona',
  [NFLTeam.LOS_ANGELES_RAMS]: 'LA Rams',
  [NFLTeam.SAN_FRANCISCO_49ERS]: 'San Francisco',
  [NFLTeam.SEATTLE_SEAHAWKS]: 'Seattle'
};

export class TeamNameStandardizer {
  /**
   * Normalize any team name variation to a standardized form
   */
  static normalizeTeamName(teamName: string): NFLTeam | null {
    if (!teamName) return null;

    const normalized = teamName
      .toLowerCase()
      .replace(/\s+(football\s+team|football\s+club|fc|football)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return TEAM_NAME_VARIATIONS[normalized] || null;
  }

  /**
   * Get the standard full name for a team
   */
  static getStandardName(teamName: string): string {
    const standardTeam = this.normalizeTeamName(teamName);
    return standardTeam || teamName;
  }

  /**
   * Get the short name used in matchup data
   */
  static getShortName(teamName: string): string {
    const standardTeam = this.normalizeTeamName(teamName);
    return standardTeam ? TEAM_SHORT_NAMES[standardTeam] : teamName;
  }

  /**
   * Check if two team names refer to the same team
   */
  static areTeamsEqual(team1: string, team2: string): boolean {
    const standardTeam1 = this.normalizeTeamName(team1);
    const standardTeam2 = this.normalizeTeamName(team2);

    return standardTeam1 !== null && standardTeam1 === standardTeam2;
  }

  /**
   * Find the opponent team in a matchup given one team
   */
  static findOpponent(team: string, awayTeam: string, homeTeam: string): string | null {
    const standardTeam = this.normalizeTeamName(team);
    const standardAway = this.normalizeTeamName(awayTeam);
    const standardHome = this.normalizeTeamName(homeTeam);

    if (!standardTeam) return null;

    if (standardTeam === standardAway) {
      return this.getShortName(homeTeam);
    } else if (standardTeam === standardHome) {
      return this.getShortName(awayTeam);
    }

    return null;
  }

  /**
   * Get all possible variations of a team name (for debugging)
   */
  static getTeamVariations(team: NFLTeam): string[] {
    return Object.keys(TEAM_NAME_VARIATIONS).filter(
      variation => TEAM_NAME_VARIATIONS[variation] === team
    );
  }
}