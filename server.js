const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { getLatestMatchScores, getNextMatch, getTodayMatches, getTopScorers, getLastMatchesBetweenTeams,getNextMatchBetweenTeams, getMatchScorers,getLeagueStandings } = require('./src/services/footballDataService');
const { normalizeCompetitionName, normalizeTeamName  } = require('./src/utils/normalization');
const { getWitResponse } = require('./src/services/witAiService');

const app = express();

app.use(bodyParser.json());
app.use(cors());

//CORS header configuration
app.use(cors({
  origin: 'https://goalbuddy-ai.web.app', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept'
}));

app.get('/', (req, res) => {
  res.send('Welcome to the Express server!');
});

const filterValidTeams = (teams) => {
  // Eliminate duplication and keep two unique teams
  const teamNames = ['portugal', 'czechia', 'spain', 'croatia'];
  const validTeams = teams.filter(team => {
    const value = team.value.toLowerCase();
    return teamNames.includes(value) && team.confidence > 0.8;
  });

  // Eliminate duplication and keep only two distinct teams
  const uniqueTeams = [...new Map(validTeams.map(item => [item['value'].toLowerCase(), item])).values()];
  return uniqueTeams.slice(0, 2);
};

// Function to filter valid competitions
const filterValidCompetition = (competitionEntities) => {
  return competitionEntities
    .map(entity => entity.value)
    .filter(value => value.toLowerCase() !== 'the');
};

app.post('/api/message', async (req, res) => {
  const { message } = req.body;

  try {
    const witResponse = await getWitResponse(message);

    console.log('Wit.ai response data:', witResponse);

    const { intents, entities } = witResponse;

    if (intents.length > 0) {
      const intent = intents[0].name;
      console.log('Detected intent:', intent);

      switch (intent) {
        
        case 'get_latest_scores':
          const competitionEntiTies = entities['competition:competition'];
          if (competitionEntiTies && competitionEntiTies.length > 0) {
            const competition = competitionEntiTies.map(e => e.value).join(' ').replace(/\bthe\b/g, '').replace(/\s+/g, ' ').trim();
            // console.log(`Extracted competition name: '${competition}'`);
            try {
              const normalizedCompetition = normalizeCompetitionName(competition);
              // console.log(`Normalized competition name: '${normalizedCompetition}'`); 
              const latestScores = await getLatestMatchScores(normalizedCompetition);
              return res.json({ text: `The latest scores for ${competition} are: ${latestScores}` });
            } catch (error) {
              return res.json({ text: `Error fetching latest scores for ${competition}: ${error.message}` });
            }
          } else {
            return res.json({ text: 'Please specify a competition.' });
          }

        case 'get_top_scorer':
          const competitionEntities = entities['competition:competition'];
          if (competitionEntities && competitionEntities.length > 0) {
              const competitionRaw = competitionEntities.map(e => e.value).join(' ').replace(/\bthe\b/g, '').trim();
              console.log(`Extracted competition name by wit.ai : ${competitionRaw}`);
      
            try {
                const normalizedCompetition = normalizeCompetitionName(competitionRaw);
                console.log(`✅ Normalized competition ID: ${normalizedCompetition}`);
            
                console.log(`🚀 Calling getTopScorers() with: ${normalizedCompetition}`);
                const topScorers = await getTopScorers(normalizedCompetition);
                console.log("✅ Debugging topScorers:", typeof topScorers, Array.isArray(topScorers), topScorers);
            
                console.log(`🎯 API response:`, topScorers);

                if (typeof topScorers === 'string') {
                  console.error("🚨 topScorers should be an array but is a string. Check getTopScorers() return value.");
                  return res.json({ text: `Error: Unexpected data format from getTopScorers().` });
                }              
            
                if (!Array.isArray(topScorers)) {
                    console.error("❌ topScorers n'est pas un tableau :", topScorers);
                    return res.json({ text: `Error fetching top scorers for ${competitionRaw}: Invalid data format.` });
                }
            
                const formattedTopScorers = topScorers.map(scorer => 
                    `${scorer.rank}. ${scorer.player ?? 'Unknown'} (${scorer.team ?? 'Unknown'}) - ${scorer.goals ?? 0} goals`
                ).join('\n');

                return res.json({ text: `Top 15 scorers in ${competitionRaw}:\n${formattedTopScorers}` });
            
            } catch (error) {
                console.error(`❌ Error in get_top_scorer:`, error);
                return res.json({ text: `Error fetching top scorers for ${competitionRaw}: ${error.message}` });
            }
          } else {
              return res.json({ text: 'Please specify a competition.' });
          }        

        case 'get_next_match':
          if (entities['team:team'] && entities['team:team'].length > 0) {
            const team = entities['team:team'][0].value;
            // console.log(`Detected team for next match: ${team}`); 
            try {
              const teamId = normalizeTeamName(team);
              // console.log(`Normalized team: ${teamId}`); 
              const nextMatch = await getNextMatch(teamId);
              return res.json({ text: `Next match for ${team}:\n${nextMatch}` });
            } catch (error) {
              return res.json({ text: `Error fetching next match for ${team}: ${error.message}` });
            }
          } else {
            return res.json({ text: 'Please specify a team.' });
          }

        case 'get_today_matches':
          const todayCompetition = entities['competition:competition']?.[0]?.value ? normalizeCompetitionName(entities['competition:competition'][0].value) : null;
          console.log('Detected competition for today matches:', todayCompetition);
      
          try {
              const todayMatches = await getTodayMatches(todayCompetition);
              if (todayMatches.length > 0) {
                const formattedMatches = todayMatches.map(match => 
                    `${match.competition.name}: ${match.homeTeam.name} vs ${match.awayTeam.name}`
                ).join('\n');
                return res.json({ text: `Today's matches are:\n${formattedMatches}` });
              } else {
                  return res.json({ text: `No matches found for today.` });
              }
            
          } catch (error) {
              return res.json({ text: `Error fetching today's matches: ${error.message}` });
          }
            
        case 'get_team_match':
          let teams = entities['team:team'];
          teams = filterValidTeams(teams); 
          // console.log(`Filtered teams:`, teams); 
          if (teams && teams.length === 2) {
            const team1 = teams[0].value;
            const team2 = teams[1].value;
            // console.log(`Detected teams: ${team1}, ${team2}`); 
            try {
              const team1Id = normalizeTeamName(team1);
              const team2Id = normalizeTeamName(team2);
              // console.log(`Normalized teams: ${team1Id}, ${team2Id}`); 
              const nextMatch = await getNextMatchBetweenTeams(team1Id, team2Id);
              const lastMatches = await getLastMatchesBetweenTeams(team1Id, team2Id, 10);
              let responseText = `Next match between ${team1} and ${team2}:\n${nextMatch}`;
              if (lastMatches.length > 0) {
                const formattedLastMatches = lastMatches.map(match => `${match.utcDate}: ${match.homeTeam.name} ${match.score.fullTime.homeTeam}-${match.score.fullTime.awayTeam} ${match.awayTeam.name}`).join('\n');
                responseText += `\n\nLast 10 matches:\n${formattedLastMatches}`;
              }
              return res.json({ text: responseText });
            } catch (error) {
              return res.json({ text: `Error fetching matches between ${team1} and ${team2}: ${error.message}` });
            }
          } else {
            // console.log(`Teams entity length: ${teams ? teams.length : 0}`); 
            return res.json({ text: 'Please specify two teams.' });
          }

        case 'get_match_scorers':
          let scorerTeams = entities['team:team'];
          scorerTeams = filterValidTeams(scorerTeams); 
          // console.log(`Filtered teams:`, scorerTeams); 
          if (scorerTeams && scorerTeams.length === 2) {
            const team1 = scorerTeams[0].value;
            const team2 = scorerTeams[1].value;
            // console.log(`Detected teams: ${team1}, ${team2}`);
            try {
              const team1Id = normalizeTeamName(team1);
              const team2Id = normalizeTeamName(team2);
              // console.log(`Normalized teams: ${team1Id}, ${team2Id}`); 
              const matchScorers = await getMatchScorers(team1Id, team2Id);
              return res.json({ text: matchScorers });
            } catch (error) {
              return res.json({ text: `Error fetching match scorers between ${team1} and ${team2}: ${error.message}` });
            }
          } else {
            // console.log(`Teams entity length: ${scorerTeams ? scorerTeams.length : 0}`); 
            return res.json({ text: 'Please specify two teams.' });
          }

        case 'get_league_standings':
          const competitionsEntities = entities['competition:competition'] || [];
          const validCompetitions = filterValidCompetition(competitionsEntities);
          const competition = validCompetitions[0];
          console.log('Detected competition for league standings:', competition);
          if (competition) {
            try {
              const normalizedCompetition = normalizeCompetitionName(competition);
              console.log('Normalized competition:', normalizedCompetition);
              const standings = await getLeagueStandings(normalizedCompetition);
              console.log('Complete API response:', JSON.stringify(standings, null, 2));
        
              if (standings && standings.standings && standings.standings.length > 0) {
                const standingsTable = standings.standings[0].table;
                if (standingsTable && standingsTable.length > 0) {
                  const standingsText = standingsTable.map((team, index) => `${index + 1}. ${team.team.name} - ${team.points} points`).join(', ');
                  return res.json({ text: `The current standings for the competition are: ${standingsText}` });
                } else {
                  const seasonInfo = standings.season;
                  const winner = seasonInfo.winner ? `Winner: ${seasonInfo.winner.name}` : "No winner data available";
                  const seasonText = `Season start: ${seasonInfo.startDate}, Season end: ${seasonInfo.endDate}, ${winner}`;
                  console.log('No table data available');
                  return res.json({ text: `No standings data available for the specified competition. ${seasonText}` });
                }
              } else {
                console.log('Standings array is empty or undefined');
                return res.json({ text: 'No standings data available for the specified competition.' });
              }
            } catch (err) {
              console.error(err);
              return res.json({ text: `Error processing competition name: ${err.message}` });
            }
          } else {
            return res.json({ text: 'I do not understand the specified competition.' });
          }
            
        default:
          return res.json({ text: 'I do not understand this request.' });
      }

    } else {

      // Check whether team entities are present even without intention
      let teams = entities['team:team'];
      teams = filterValidTeams(teams); 
      // console.log(`Filtered teams without intent:`, teams); 
      if (teams && teams.length === 2) {
        const team1 = teams[0].value;
        const team2 = teams[1].value;
        // console.log(`Detected teams without intent: ${team1}, ${team2}`); 
        try {
          const team1Id = normalizeTeamName(team1);
          const team2Id = normalizeTeamName(team2);
          // console.log(`Normalized teams without intent: ${team1Id}, ${team2Id}`); 
          const nextMatch = await getNextMatchBetweenTeams(team1Id, team2Id);
          const lastMatches = await getLastMatchesBetweenTeams(team1Id, team2Id, 10);
          let responseText = `Next match between ${team1} and ${team2}:\n${nextMatch}`;
          if (lastMatches.length > 0) {
            const formattedLastMatches = lastMatches.map(match => `${match.utcDate}: ${match.homeTeam.name} ${match.score.fullTime.homeTeam}-${match.score.fullTime.awayTeam} ${match.awayTeam.name}`).join('\n');
            responseText += `\n\nLast 10 matches:\n${formattedLastMatches}`;
          }
          return res.json({ text: responseText });
        } catch (error) {
          return res.json({ text: `Error fetching matches between ${team1} and ${team2}: ${error.message}` });
        }
      } else {
        // console.log(`Teams entity length without intent: ${teams ? teams.length : 0}`); 
        return res.json({ text: 'I do not understand this request.' });
      }

    }
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).send('Error processing message');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});


