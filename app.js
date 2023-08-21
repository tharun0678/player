const express = require("express");
const app = express();
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const intializeAndConnectDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server is Running at http://localhost:3000`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

intializeAndConnectDb();

function convertObjectToArray(object) {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
  };
}
//API - 1
app.get("/players/", async (request, response) => {
  const getAllPlayers = `
    select * from player_details order by player_id;`;
  const objectPlayers = await db.all(getAllPlayers);
  response.send(
    objectPlayers.map((eachPlayer) => {
      return convertObjectToArray(eachPlayer);
    })
  );
});

//API - 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
    select * from player_details 
    where player_id = ${playerId};`;
  const player = await db.get(getPlayer);
  const result = convertObjectToArray(player);
  response.send(result);
});

//API - 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayer = `
  update player_details 
  set player_name = '${playerName}'
  where player_id = ${playerId};`;

  await db.run(updatePlayer);

  response.send(`Player Details Updated`);
});

function convertMatchObjectToArray(object) {
  return {
    matchId: object.match_id,
    match: object.match,
    year: object.year,
  };
}
//API - 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatch = `
    select * from match_details where match_id = ${matchId};`;
  const result = await db.get(getMatch);
  const match = convertMatchObjectToArray(result);
  console.log(match);
  response.send(match);
});

//API - 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchs = `select match_details.match_id as matchId, match_details.match as match, match_details.year as year 
    from match_details inner join player_match_score 
    on match_details.match_id = player_match_score.match_id
    where player_id = ${playerId};`;

  const list_of_matchs = await db.all(matchs);

  response.send(list_of_matchs);
});

//API - 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const players = `
    select player_details.player_id as playerId, player_details.player_name as playerName from player_details
    inner join player_match_score 
    on player_details.player_id = player_match_score.player_id 
    where player_match_score.match_id = ${matchId};`;

  const playersList = await db.all(players);
  response.send(playersList);
});

//API - 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const totalScore = `
    select player_details.player_id as playerId,
    player_details.player_name as playerName,
    sum(player_match_score.score) as totalScore,
    sum(player_match_score.fours) as totalFours,
    sum(player_match_score.sixes) as totalSixes from player_match_score
    inner join player_details
    on player_match_score.player_id = player_details.player_id 
    where player_match_score.player_id = ${playerId};`;

  const result = await db.get(totalScore);
  response.send(result);
});

module.exports = app;
