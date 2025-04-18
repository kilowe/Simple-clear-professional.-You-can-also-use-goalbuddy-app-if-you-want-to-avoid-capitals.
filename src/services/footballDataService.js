const axios = require('axios');
const { normalizeCompetitionName } = require('../utils/normalization');
const {competitionNumIds} = require('./competitionNumIds');
// link to api football-data.org
const apiBaseUrl = 'https://api.football-data.org/v4';
// Api key of football-data 
const apiKey = '5b3cd03950254bf182691fc77731dfcc'; 

// Retrieves the latest finished matches for a given competition and formats the results.
const getLatestMatchScores = async (competition) => {
    // console.log(`Fetching latest match scores for competition ID: ${competition}`);
    try {
        const response = await axios.get(`${apiBaseUrl}/competitions/${competition}/matches`, {
            headers: {
                'X-Auth-Token': apiKey
            }
        });
        const matches = response.data.matches.filter(match => match.status === 'FINISHED');
        const latestDate = matches.reduce((latest, match) => {
            return new Date(match.utcDate) > new Date(latest.utcDate) ? match : latest;
        }).utcDate;

        const latestMatches = matches.filter(match => match.utcDate === latestDate);
        return latestMatches.map(match => `${match.homeTeam.name} ${match.score.fullTime.homeTeam} - ${match.score.fullTime.awayTeam} ${match.awayTeam.name}`).join(', ');
    } catch (error) {
        // console.error('Erreur lors de la récupération des scores :', error);
        throw new Error('Error when retrieving scores');
    }
};

// Retrieves the next scheduled match for a given team based on its ID.
const getNextMatch = async (teamId) => {
    try {
        const matchesResponse = await axios.get(`${apiBaseUrl}/teams/${teamId}/matches?status=SCHEDULED`, {
            headers: { 'X-Auth-Token': apiKey }
        });

        const nextMatch = matchesResponse.data.matches[0];

        if (!nextMatch) {
            return `There are no scheduled matches for this team.`;
        }

        const homeTeam = nextMatch.homeTeam.name;
        const awayTeam = nextMatch.awayTeam.name;
        const date = new Date(nextMatch.utcDate).toLocaleDateString();

        return `Is ${homeTeam} vs ${awayTeam} on ${date}.`;
    } catch (error) {
        throw new Error('Error when retrieving next match');
    }
};

// Retrieves all matches scheduled for today (UTC) for all competitions or a specific one.
// Uses a buffer window of yesterday and tomorrow to ensure timezone accuracy.
const getTodayMatches = async (competition = null) => {
    const competitionId = competition ? normalizeCompetitionName(competition) : null;

    // On récupère les matchs entre hier et demain pour s'assurer d'avoir les matchs d'aujourd'hui
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let url = `${apiBaseUrl}/matches?dateFrom=${yesterdayStr}&dateTo=${tomorrowStr}`;
    console.log("Fetching today's matches from URL:", url);

    if (competitionId) {
        url += `&competitions=${competitionId}`;
    }

    try {
        const response = await axios.get(url, {
            headers: { 'X-Auth-Token': apiKey }
        });

        console.log("Raw API Response:", JSON.stringify(response.data, null, 2));

        // **Correction : Filtrage des matchs uniquement pour AUJOURD'HUI en prenant en compte le format UTC**
        const todayMatches = response.data.matches.filter(match => {
            const matchDate = new Date(match.utcDate).toISOString().split('T')[0];
            return matchDate === todayStr;
        });

        console.log(`📌 Found ${todayMatches.length} matches for today.`);
        return todayMatches.length > 0 ? todayMatches : [];
    } catch (error) {
        throw new Error(`Error fetching today's matches${competitionId ? ` for competition: ${competitionId}` : ''}`);
    }
};

// Retrieves and formats the top scorers for a given competition.
// Returns the top 10 ranked players with name, team and number of goals.
const getTopScorers = async (competitionName) => {
    const competitionId = normalizeCompetitionName(competitionName);

    try {
        console.log(`🚀 Fetching top scorers for: ${competitionId}`);

        const response = await axios.get(`${apiBaseUrl}/competitions/${competitionId}/scorers`, {
            headers: { 'X-Auth-Token': apiKey }
        });

        console.log("📌 Raw API Response:", JSON.stringify(response.data, null, 2));

        // Vérifier si `scorers` est un tableau valide
        if (!response.data.scorers || !Array.isArray(response.data.scorers)) {
            console.error("❌ API Response format incorrect - 'scorers' n'est pas un tableau !");
            throw new Error("API response format incorrect, 'scorers' is not an array.");
        }

        const formattedScorers = response.data.scorers.slice(0, 10).map((scorer, index) => ({
            rank: index + 1,
            player: scorer.player.name,
            team: scorer.team.name,
            goals: scorer.goals ?? 0
        }));
        
        console.log("🎯 Formatted Top Scorers (corrected):", formattedScorers);
        return formattedScorers; 

    } catch (error) {
        console.error(`❌ API Error fetching top scorers:`, error.response ? error.response.data : error.message);
        throw new Error(`Error fetching top scorers for competition: ${competitionName}`);
    }
};

// Finds the next scheduled match between two specific teams within the next year.
const getNextMatchBetweenTeams = async (team1Id, team2Id) => {
    const today = new Date().toISOString().split('T')[0];
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    const dateTo = oneYearLater.toISOString().split('T')[0];

    const url = `${apiBaseUrl}/teams/${team1Id}/matches?status=SCHEDULED&dateFrom=${today}&dateTo=${dateTo}`;

    try {
        console.log(`Fetching next match between teams ${team1Id} and ${team2Id} from URL: ${url}`);
        const response = await axios.get(url, {
            headers: { 'X-Auth-Token': apiKey }
        });
        const matches = response.data.matches.filter(match => match.awayTeam.id === team2Id || match.homeTeam.id === team2Id);
        if (matches.length > 0) {
            return `${matches[0].utcDate}: ${matches[0].homeTeam.name} vs ${matches[0].awayTeam.name}`;
        } else {
            return 'No upcoming match found.';
        }
    } catch (error) {
        // console.error(`Error fetching next match between ${team1Id} and ${team2Id}:`, error);
        throw new Error(`Error fetching next match between ${team1Id} and ${team2Id}`);
    }
};

// Retrieves the last N finished matches between two teams.
// Filters from the match history of the first team.
const getLastMatchesBetweenTeams = async (team1Id, team2Id, limit = 10) => {
    const url = `${apiBaseUrl}/teams/${team1Id}/matches?status=FINISHED&limit=${limit}`;

    try {
        console.log(`Fetching last ${limit} matches between teams ${team1Id} and ${team2Id} from URL: ${url}`);
        const response = await axios.get(url, {
            headers: { 'X-Auth-Token': apiKey }
        });
        const matches = response.data.matches.filter(match => match.awayTeam.id === team2Id || match.homeTeam.id === team2Id);
        if (matches.length > 0) {
            return matches.slice(0, limit);
        } else {
            return [];
        }
    } catch (error) {
        // console.error(`Error fetching last matches between ${team1Id} and ${team2Id}:`, error);
        throw new Error(`Error fetching last matches between ${team1Id} and ${team2Id}`);
    }
};

// Fetches all goals of a given match using its match ID.
// Extracts information like scorer, assist and time of goal.
const getMatchEvents = async (matchId) => {
const url = `${apiBaseUrl}/matches/${matchId}`;

try {
    console.log(`Fetching events for match ${matchId} from URL: ${url}`);
    const response = await axios.get(url, {
    headers: { 'X-Auth-Token': apiKey }
    });

    console.log('Match events data:', response.data);

    // Check that events include goalscorers and assists
    if (response.data.match && response.data.match.goals) {
    const goals = response.data.match.goals.map(goal => {
        const minute = goal.minute;
        const player = goal.scorer ? goal.scorer.name : 'Unknown';
        const team = goal.team ? goal.team.name : 'Unknown';
        const assist = goal.assist ? `- assist ${goal.assist.name}` : '';
        return `${player} ${assist} ${minute}' (${team})`;
    });

    const goalsText = goals.join('\n');
    return `The scorers of the match are:\n${goalsText}`;
    } else {
    return `No scorers found for the match.`;
    }
} catch (error) {
    // console.error(`Error fetching events for match ${matchId}:`, error);
    throw new Error(`Error fetching events for match ${matchId}`);
}
};

// Retrieves scorers from the most recent finished match between two given teams.
const getMatchScorers = async (team1Id, team2Id) => {
const today = new Date().toISOString().split('T')[0];
const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
const dateFrom = oneYearAgo.toISOString().split('T')[0];

const url = `${apiBaseUrl}/teams/${team1Id}/matches?status=FINISHED&dateFrom=${dateFrom}&dateTo=${today}`;

try {
    console.log(`Fetching finished matches between teams ${team1Id} and ${team2Id} from URL: ${url}`);
    const response = await axios.get(url, {
    headers: { 'X-Auth-Token': apiKey }
    });
    const matches = response.data.matches.filter(match => (match.awayTeam.id === team2Id && match.homeTeam.id === team1Id) || (match.awayTeam.id === team1Id && match.homeTeam.id === team2Id));

    if (matches.length > 0) {
    const lastMatch = matches[0]; // Take the last match completed between the two teams
    const matchId = lastMatch.id;

    // Use the new endpoint to obtain match events
    return await getMatchEvents(matchId);
    } else {
    return 'No finished match found between the specified teams.';
    }
} catch (error) {
    console.error(`Error fetching match scorers between ${team1Id} and ${team2Id}:`, error);
    throw new Error(`Error fetching match scorers between ${team1Id} and ${team2Id}`);
}
};

// Fetches the current league standings for a competition using its numeric code.
const getLeagueStandings = async (competitionId) => {
    const competitionCode = competitionNumIds[competitionId];
  
    if (!competitionCode) {
      throw new Error(`Code concours not found : ${competitionId}`);
    }
  
    const url = `${apiBaseUrl}/competitions/${competitionCode}/standings`;
  
    try {
      const response = await axios.get(url, {
        headers: {
          'X-Auth-Token': apiKey
        }
      });
      console.log("Complete API response:", JSON.stringify(response.data, null, 2)); // Display full API response for debugging
      console.log("League standings data:", response.data.standings); // Display ranking data for debugging purposes
      return response.data;
    } catch (error) {
      console.error('Error fetching standings for competition:', error.message); // Display API error
      throw new Error(`Error fetching standings for competition: ${competitionId}`);
    }
  };

// Export all data service functions for external use in routes/controllers.
// const getCompetitions = async () => {
// try {
//     const response = await axios.get('https://api.football-data.org/v2/competitions', {
//         headers: { 'X-Auth-Token': apiKey }
//     });

//     const competitions = response.data.competitions;
//     console.log('Available competitions and their IDs:');
//     competitions.forEach(competition => {
//         console.log(`\'${competition.code}\': \'${competition.id}\',`);
//     });
// } catch (error) {
//     console.error('Error fetching competitions:', error);
// }
// };

// getCompetitions();
  

module.exports = {
    getLatestMatchScores,
    getNextMatch,
    getTodayMatches,
    getTopScorers,
    getLastMatchesBetweenTeams,
    getNextMatchBetweenTeams,
    getMatchScorers, // don't work for the moment 
    getLeagueStandings,
};
