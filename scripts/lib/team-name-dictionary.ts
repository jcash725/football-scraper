#!/usr/bin/env tsx
// Comprehensive NFL Team Name Standardization Dictionary
// Maps all possible team name variations to a single canonical name

export interface TeamMapping {
  canonical: string;
  city: string;
  mascot: string;
  abbreviations: string[];
  variations: string[];
}

export const NFL_TEAMS: Record<string, TeamMapping> = {
  // AFC East
  'buffalo-bills': {
    canonical: 'Buffalo Bills',
    city: 'Buffalo',
    mascot: 'Bills',
    abbreviations: ['BUF', 'BUFF'],
    variations: ['Buffalo', 'Bills']
  },
  'miami-dolphins': {
    canonical: 'Miami Dolphins',
    city: 'Miami',
    mascot: 'Dolphins',
    abbreviations: ['MIA', 'MIAMI'],
    variations: ['Miami', 'Dolphins']
  },
  'new-england-patriots': {
    canonical: 'New England Patriots',
    city: 'New England',
    mascot: 'Patriots',
    abbreviations: ['NE', 'NEP', 'PATS'],
    variations: ['New England', 'Patriots', 'Pats']
  },
  'new-york-jets': {
    canonical: 'New York Jets',
    city: 'New York',
    mascot: 'Jets',
    abbreviations: ['NYJ', 'NY Jets'],
    variations: ['NY Jets', 'New York Jets', 'Jets']
  },

  // AFC North
  'baltimore-ravens': {
    canonical: 'Baltimore Ravens',
    city: 'Baltimore',
    mascot: 'Ravens',
    abbreviations: ['BAL', 'BALT'],
    variations: ['Baltimore', 'Ravens']
  },
  'cincinnati-bengals': {
    canonical: 'Cincinnati Bengals',
    city: 'Cincinnati',
    mascot: 'Bengals',
    abbreviations: ['CIN', 'CINC'],
    variations: ['Cincinnati', 'Bengals']
  },
  'cleveland-browns': {
    canonical: 'Cleveland Browns',
    city: 'Cleveland',
    mascot: 'Browns',
    abbreviations: ['CLE', 'CLEV'],
    variations: ['Cleveland', 'Browns']
  },
  'pittsburgh-steelers': {
    canonical: 'Pittsburgh Steelers',
    city: 'Pittsburgh',
    mascot: 'Steelers',
    abbreviations: ['PIT', 'PITT'],
    variations: ['Pittsburgh', 'Steelers']
  },

  // AFC South
  'houston-texans': {
    canonical: 'Houston Texans',
    city: 'Houston',
    mascot: 'Texans',
    abbreviations: ['HOU', 'HOUS'],
    variations: ['Houston', 'Texans']
  },
  'indianapolis-colts': {
    canonical: 'Indianapolis Colts',
    city: 'Indianapolis',
    mascot: 'Colts',
    abbreviations: ['IND', 'INDY'],
    variations: ['Indianapolis', 'Colts', 'Indy']
  },
  'jacksonville-jaguars': {
    canonical: 'Jacksonville Jaguars',
    city: 'Jacksonville',
    mascot: 'Jaguars',
    abbreviations: ['JAX', 'JAC', 'JAGS'],
    variations: ['Jacksonville', 'Jaguars', 'Jags']
  },
  'tennessee-titans': {
    canonical: 'Tennessee Titans',
    city: 'Tennessee',
    mascot: 'Titans',
    abbreviations: ['TEN', 'TENN'],
    variations: ['Tennessee', 'Titans']
  },

  // AFC West
  'denver-broncos': {
    canonical: 'Denver Broncos',
    city: 'Denver',
    mascot: 'Broncos',
    abbreviations: ['DEN', 'DENV'],
    variations: ['Denver', 'Broncos']
  },
  'kansas-city-chiefs': {
    canonical: 'Kansas City Chiefs',
    city: 'Kansas City',
    mascot: 'Chiefs',
    abbreviations: ['KC', 'KAN', 'KCCH'],
    variations: ['Kansas City', 'Chiefs', 'KC']
  },
  'las-vegas-raiders': {
    canonical: 'Las Vegas Raiders',
    city: 'Las Vegas',
    mascot: 'Raiders',
    abbreviations: ['LV', 'LVR', 'RAID'],
    variations: ['Las Vegas', 'Raiders', 'LV', 'Oakland Raiders', 'Oakland']
  },
  'los-angeles-chargers': {
    canonical: 'Los Angeles Chargers',
    city: 'Los Angeles',
    mascot: 'Chargers',
    abbreviations: ['LAC', 'LA Chargers', 'CHAR'],
    variations: ['LA Chargers', 'Los Angeles Chargers', 'Chargers', 'San Diego Chargers', 'San Diego']
  },

  // NFC East
  'dallas-cowboys': {
    canonical: 'Dallas Cowboys',
    city: 'Dallas',
    mascot: 'Cowboys',
    abbreviations: ['DAL', 'DALL'],
    variations: ['Dallas', 'Cowboys']
  },
  'new-york-giants': {
    canonical: 'New York Giants',
    city: 'New York',
    mascot: 'Giants',
    abbreviations: ['NYG', 'NY Giants'],
    variations: ['NY Giants', 'New York Giants', 'Giants']
  },
  'philadelphia-eagles': {
    canonical: 'Philadelphia Eagles',
    city: 'Philadelphia',
    mascot: 'Eagles',
    abbreviations: ['PHI', 'PHIL'],
    variations: ['Philadelphia', 'Eagles']
  },
  'washington-commanders': {
    canonical: 'Washington Commanders',
    city: 'Washington',
    mascot: 'Commanders',
    abbreviations: ['WAS', 'WASH', 'WSH'],
    variations: ['Washington', 'Commanders', 'Washington Football Team', 'WFT', 'Washington Redskins']
  },

  // NFC North
  'chicago-bears': {
    canonical: 'Chicago Bears',
    city: 'Chicago',
    mascot: 'Bears',
    abbreviations: ['CHI', 'CHIC'],
    variations: ['Chicago', 'Bears']
  },
  'detroit-lions': {
    canonical: 'Detroit Lions',
    city: 'Detroit',
    mascot: 'Lions',
    abbreviations: ['DET', 'DETR'],
    variations: ['Detroit', 'Lions']
  },
  'green-bay-packers': {
    canonical: 'Green Bay Packers',
    city: 'Green Bay',
    mascot: 'Packers',
    abbreviations: ['GB', 'GBP', 'PACK'],
    variations: ['Green Bay', 'Packers']
  },
  'minnesota-vikings': {
    canonical: 'Minnesota Vikings',
    city: 'Minnesota',
    mascot: 'Vikings',
    abbreviations: ['MIN', 'MINN'],
    variations: ['Minnesota', 'Vikings']
  },

  // NFC South
  'atlanta-falcons': {
    canonical: 'Atlanta Falcons',
    city: 'Atlanta',
    mascot: 'Falcons',
    abbreviations: ['ATL', 'ATLA'],
    variations: ['Atlanta', 'Falcons']
  },
  'carolina-panthers': {
    canonical: 'Carolina Panthers',
    city: 'Carolina',
    mascot: 'Panthers',
    abbreviations: ['CAR', 'CARO'],
    variations: ['Carolina', 'Panthers']
  },
  'new-orleans-saints': {
    canonical: 'New Orleans Saints',
    city: 'New Orleans',
    mascot: 'Saints',
    abbreviations: ['NO', 'NOS', 'NOLA'],
    variations: ['New Orleans', 'Saints']
  },
  'tampa-bay-buccaneers': {
    canonical: 'Tampa Bay Buccaneers',
    city: 'Tampa Bay',
    mascot: 'Buccaneers',
    abbreviations: ['TB', 'TAM', 'BUCS'],
    variations: ['Tampa Bay', 'Buccaneers', 'Bucs', 'Tampa']
  },

  // NFC West
  'arizona-cardinals': {
    canonical: 'Arizona Cardinals',
    city: 'Arizona',
    mascot: 'Cardinals',
    abbreviations: ['ARI', 'ARIZ'],
    variations: ['Arizona', 'Cardinals']
  },
  'los-angeles-rams': {
    canonical: 'Los Angeles Rams',
    city: 'Los Angeles',
    mascot: 'Rams',
    abbreviations: ['LAR', 'LA Rams'],
    variations: ['LA Rams', 'Los Angeles Rams', 'Rams', 'St. Louis Rams', 'St Louis']
  },
  'san-francisco-49ers': {
    canonical: 'San Francisco 49ers',
    city: 'San Francisco',
    mascot: '49ers',
    abbreviations: ['SF', 'SFO', '49ERS'],
    variations: ['San Francisco', '49ers', 'Niners', 'SF']
  },
  'seattle-seahawks': {
    canonical: 'Seattle Seahawks',
    city: 'Seattle',
    mascot: 'Seahawks',
    abbreviations: ['SEA', 'SEAT'],
    variations: ['Seattle', 'Seahawks']
  }
};

export class TeamNameStandardizer {
  private lookupMap: Map<string, string> = new Map();

  constructor() {
    this.buildLookupMap();
  }

  private buildLookupMap(): void {
    for (const [key, team] of Object.entries(NFL_TEAMS)) {
      const canonical = team.canonical;

      // Add canonical name
      this.lookupMap.set(this.normalize(canonical), canonical);

      // Add city only
      this.lookupMap.set(this.normalize(team.city), canonical);

      // Add mascot only
      this.lookupMap.set(this.normalize(team.mascot), canonical);

      // Add abbreviations
      team.abbreviations.forEach(abbr => {
        this.lookupMap.set(this.normalize(abbr), canonical);
      });

      // Add variations
      team.variations.forEach(variation => {
        this.lookupMap.set(this.normalize(variation), canonical);
      });

      // Add key itself
      this.lookupMap.set(this.normalize(key), canonical);
    }
  }

  private normalize(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * Standardize a team name to its canonical form
   */
  standardize(teamName: string): string {
    if (!teamName) return 'Unknown';

    const normalized = this.normalize(teamName);
    const canonical = this.lookupMap.get(normalized);

    if (canonical) {
      return canonical;
    }

    // Try partial matching for more complex cases
    for (const [key, value] of this.lookupMap.entries()) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return value;
      }
    }

    // Return original if no match found
    return teamName;
  }

  /**
   * Get just the city name for a team
   */
  getCity(teamName: string): string {
    const canonical = this.standardize(teamName);
    const team = Object.values(NFL_TEAMS).find(t => t.canonical === canonical);
    return team?.city || teamName;
  }

  /**
   * Get just the mascot name for a team
   */
  getMascot(teamName: string): string {
    const canonical = this.standardize(teamName);
    const team = Object.values(NFL_TEAMS).find(t => t.canonical === canonical);
    return team?.mascot || teamName;
  }

  /**
   * Get the primary abbreviation for a team
   */
  getAbbreviation(teamName: string): string {
    const canonical = this.standardize(teamName);
    const team = Object.values(NFL_TEAMS).find(t => t.canonical === canonical);
    return team?.abbreviations[0] || teamName;
  }

  /**
   * Check if two team names refer to the same team
   */
  isSameTeam(team1: string, team2: string): boolean {
    return this.standardize(team1) === this.standardize(team2);
  }

  /**
   * Get all valid names for a team (for debugging)
   */
  getAllVariations(teamName: string): string[] {
    const canonical = this.standardize(teamName);
    const team = Object.values(NFL_TEAMS).find(t => t.canonical === canonical);

    if (!team) return [teamName];

    return [
      team.canonical,
      team.city,
      team.mascot,
      ...team.abbreviations,
      ...team.variations
    ];
  }
}