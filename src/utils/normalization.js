const stringSimilarity = require('string-similarity');
const teamIds = require('../services/teamIds');
const competitionIds = require('../services/competitionIds');

// Function to standardize team names
const normalizeTeamName = (teamName) => {
    const normalizedTeamName = teamName.toLowerCase().trim();
    const teamNames = Object.keys(teamIds);
    const bestMatch = stringSimilarity.findBestMatch(normalizedTeamName, teamNames).bestMatch;
  
    if (bestMatch.rating > 0.5) {
      return teamIds[bestMatch.target];
    } else {
      throw new Error(`Team not found: ${teamName}`);
    }
  };

// Function to clean the competition name
const preprocessCompetitionName = (competitionName) => {
  if (typeof competitionName !== 'string') {
    throw new Error(`Invalid competition name: ${competitionName}`);
  }
  return competitionName.toLowerCase().replace(/^the\s+/i, '').trim();
};

// Function to normalize competition names
const normalizeCompetitionName = (competitionName) => {
  if (!competitionName || typeof competitionName !== 'string') {
      throw new Error(`Invalid competition name received: ${competitionName}`);
  }

  // ✅ Vérification : Si le nom est déjà un ID valide, on le retourne directement
  if (Object.values(competitionIds).includes(competitionName)) {
      return competitionName; // Ex : "CL" est déjà un ID valide, donc on le retourne immédiatement
  }

  const cleanedName = preprocessCompetitionName(competitionName);
  console.log(`🧐 Normalizing competition name: '${competitionName}' -> '${cleanedName}'`);

  const competitionNames = Object.keys(competitionIds);
  console.log(`📌 Available competitions:`, competitionNames);

  const bestMatch = stringSimilarity.findBestMatch(cleanedName, competitionNames).bestMatch;
  console.log(`🎯 Best match found: ${bestMatch.target} (Score: ${bestMatch.rating})`);

  if (bestMatch.rating > 0.5) { 
      return competitionIds[bestMatch.target];
  } else {
      throw new Error(`Competition not found: ${competitionName}`);
  }
};

module.exports = {
    normalizeTeamName,
    normalizeCompetitionName
};
