import React from 'react';
import './App.css';

// import all handles
import {playerNames, playerIDs, setPlayerInfo} from './js/MainHandlers.js';
import './js/FormatHandlers.js';
import { songData, getMap } from './js/MapHandlers.js';
import {resetAllPlayers, scoreUpdate, userWinScore, handleSkip, handleReplay} from "./js/UserScoringHandlers";

import { setOverlay } from './js/OverlayHandlers.js';

// TA client thingy
import {Tournament, Match, Response_ResponseType, TAClient, User_ClientTypes} from 'moons-ta-client';
import {wait} from "@testing-library/user-event/dist/utils";

const taToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjRFOTc0RUE5RTk4RkI5MzJFRUNBOEEyODc0MjBBOThCMjg4M0JEREIiLCJ4NXQiOiJUcGRPcWVtUHVUTHV5b29vZENDcGl5aUR2ZHMiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOiIxNzMxNTI2OTI5IiwiZXhwIjoiMjA0NzA1OTcyOSIsInRhOmRpc2NvcmRfaWQiOiJhNjhlYzYxOS1iMThhLTQ4NTUtYTI2My00MzUwOGM2YTY3YzAiLCJ0YTpkaXNjb3JkX25hbWUiOiJ0ZXN0Qm90RmxpdHMiLCJ0YTpkaXNjb3JkX2F2YXRhciI6IiIsImlzcyI6InRhX3NlcnZlciIsImF1ZCI6InRhX3VzZXJzIn0.JEnCRcSmiXRZ0OjEerCrtmvyq8JjVfiZH9mtkC7DKNf9G7Zu0J2k6jNiOWNGU9YEUmLtZwjEk77RNwrE4MSztWHOwcwDrIGk7ViYyinis10uKGpOpojP_teJC4G0t9WTvSzVQBzxSkh0m4pCcx3u7HDihszV0bRdtM1ww_yOTYwXFJJtym2CEK2G_iQvl47hpH5M8Q5cW12SFfvzVcQy308ZiWuwgItT7QDvWIv2MoH9tc6iQ20GJ3NpOnGtpQxC1GimYDJ2XXgNnvL3aC_VlVckBL-JsmS3TN69_KcgkErDRk1dSDChj8ZC8GInDTlKlrQG702oV1mZd2bA528fJQ";

let myTourney: Tournament;
export let client: TAClient;
let nextMatchNr = 0;
let currentMatch: Match;
let audioSwitch = false;

async function addUsers(client: TAClient, myTourney: Tournament, matchNr: number)
{
  console.log("Add user to match");
  if(client.stateManager.getMatches(myTourney.guid)!.length <= matchNr) matchNr = 0;
  if (client.stateManager.getMatches(myTourney.guid) !== undefined && client.stateManager.getMatches(myTourney.guid)!.length > 0) {
    let match = client.stateManager.getMatches(myTourney.guid)![matchNr];
    matchNr++;
    await client.addUserToMatch(myTourney.guid, match.guid, client.stateManager.getSelfGuid());
    // maybe error check? NAHH
    let users = client.stateManager.getUsers(myTourney.guid)!.filter(x => match.associatedUsers.includes(x.guid) && x.clientType === User_ClientTypes.Player);
    if (users.length === 0) return;
    console.log(users);
    setPlayerInfo(users.map(x => x.guid), users.map(x => x.name));
    await setOverlay(users.map(x => x.guid), users.map(x => x.name), users.map(x => x.platformId));
    currentMatch = match;
  }
}

async function nextMatch()
{
  // for (const match of client.stateManager.getMatches(myTourney.guid)!){
  //   await client.removeUserFromMatch(myTourney.guid, match.guid, client.stateManager.getSelfGuid());
  // }
  console.log(currentMatch);
  if(currentMatch === undefined) return;
  let match = client.stateManager.getMatches(myTourney.guid)![(nextMatchNr > 1)? nextMatchNr - 1 : 0];
  await client.removeUserFromMatch(myTourney.guid, match!.guid!, client.stateManager.getSelfGuid());
  console.log("Removed user from match");
  await addUsers(client, myTourney, nextMatchNr);
    console.log("Next match");
    console.log(nextMatchNr);
}

function App() {
  const handleButton = (player: any, action: any) =>{
    if(action === "skip") {
      console.log("Player " + player + " skipped");
      handleSkip(player);
    }
    else {
      console.log("Player " + player + " replayed");
      handleReplay(player);
    }
  };
  let [taClient, setTaClient] = React.useState<TAClient>();
  React.useEffect(() => {
    let userScores: {userGuid: string | undefined, score: number} = {userGuid: "", score: 0};
    const createTaClient = async() => {

      // Create a tournament assistant client
      client = new TAClient();

      client.on("realtimeScore", (score) => {
        console.log(score);
        scoreUpdate(score["userGuid"], score["score"], score["combo"], score["accuracy"], score["notesMissed"], 0, score["songPosition"]);
      });

      client.on("songFinished", async(songFinished) => {
        console.log("Song finished");
        if(songFinished["matchId"] !== currentMatch?.guid) return;
        if(userScores.userGuid === "")
        {
          userScores = {userGuid: songFinished.player!.guid, score: songFinished.score};
        }
        if(userScores.score < songFinished.score)
        {
          userWinScore(songFinished.player!.guid);
          userScores = {userGuid: "", score: 0};
        }
        else
        {
          userWinScore(userScores.userGuid);
          userScores = {userGuid: "", score: 0};
        }
      });

      client.stateManager.on("matchUpdated",  async([match, tournament]: [Match, Tournament]) => {
        console.log("Updated match");
        let levelID = match.selectedMap?.gameplayParameters?.beatmap?.levelId.toLowerCase().slice(13);
        let levelDiff = match.selectedMap?.gameplayParameters?.beatmap?.difficulty;
        getMap(levelID, levelDiff);
      });

      client.stateManager.on("matchCreated",  async([match, tournament]: [Match, Tournament]) => {
        console.log("Created match");
        if(currentMatch === undefined)
        {
          console.log("Match created");
          addUsers(client, tournament, nextMatchNr);
        }
      });

      client.stateManager.on("matchDeleted",  async([match, tournament]: [Match, Tournament]) => {
        console.log("Deleted match");
        if(currentMatch?.guid === match?.guid)
        {
          // currentMatch = undefined;
          resetAllPlayers();
        }
      });

      client.on("failedToCreateMatch", (score) => {
        console.log("failed to create Match");
      });

      // Set the authorisation token to ta token
      client.setAuthToken(taToken!);

      // Connect to the tournamentassistant server
      // const response = await client.connect("dev.tournamentassistant.net", "8676"); // if using dev server
      const response = await client.connect("server.tournamentassistant.net", "8676");
      console.log(response);

      // Check if the connection is successful and the auth token is valid
      if (response.details.oneofKind === "connect" && response.type !== Response_ResponseType.Success) {
        console.log(response.details.connect.message); // Provide user with error message if connection is unsuccessful
      }

      await wait(1000); // Wait for the connection to be established

      // Create a tournament instance which we will then use
      myTourney = client.stateManager.getTournaments().find(x => x.settings?.tournamentName === "Moon's Test Tourney")!;

      // Join the tournament
      if (myTourney) {
        await client.joinTournament(myTourney.guid);
        console.log("actually joined tournament");
      } else {
        console.log("No tournament found with that name");
      }

      // Check if the tournament exists
      if (!myTourney) {
        console.log("No tournament found with that name");
      } else {
        // Print the currently connected users
        console.log(client.stateManager.getUsers(myTourney.guid));
        console.log(client.stateManager.getMatches(myTourney.guid));
      }

      addUsers(client, myTourney, nextMatchNr);
    setTaClient(client);
    };
    console.log("Creating TA client");
    createTaClient();
  }, []);
  return (
      <body className="BGImage">
      <div className="MainClass">
        <div className="PlayerContainers" id="PlayerContainers">
          <div className="Player1Container" id="Player1Container">
            <p className="Player1Name" id="Player1Name">OK</p>
            <button className="Player1SkipBase" id="Player1SkipBase"
                    onClick={(e) => handleButton(0, "skip")}></button>
            <button className="Player1ReplayBase" id="Player1ReplayBase"
                    onClick={(e) => handleButton(0, "replay")}></button>
            <div className="Scores" id="ScoresLeft">
              <div className="Player1Score" id="Player1Score2"></div>
              <div className="Player1Score" id="Player1Score1"></div>
              <div className="Player1Score" id="Player1Score0"></div>
            </div>
            <div className="imageContainer1" id="imageContainer1">
              <img src="../public/images/Placeholder.png" className="Player1Image" id="Player1Image"/>
            </div>
          </div>
          <div className="LogoSpot" id="LogoContainer">
          </div>
          <div className="Player2Container" id="Player2Container">
            <div className="imageContainer2" id="imageContainer2">
              <img src="../public/images/Placeholder.png" className="Player2Image" id="Player2Image"/>
            </div>
            <div className="Scores" id="ScoresRight">
              <div className="Player2Score" id="Player2Score0"></div>
              <div className="Player2Score" id="Player2Score1"></div>
              <div className="Player2Score" id="Player2Score2"></div>
            </div>
            <button className="Player2SkipBase" id="Player2SkipBase"
                    onClick={(e) => handleButton(1, "skip")}></button>
            <button className="Player2ReplayBase" id="Player2ReplayBase"
                    onClick={(e) => handleButton(1, "replay")}></button>
            <p className="Player2Name" id="Player2Name">BOOMER</p>
          </div>
          <div className="divLine" id="divLine"></div>

          {/* control button(s) */}
          <button className={"NextButton"} id={"NextButton"} onClick={async (e) => {
            await nextMatch();
          }}>
          </button>

        </div>

        {/* Streams */}
        <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            src=""
            id="player1iframe"
        ></iframe>
        <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            src=""
            id="player2iframe"
        ></iframe>

        {/*Player scores*/}
        <div className="PlayerBounds ScoringShadow FadeIn" id="PlayerBounds">
          <div className="Player1Class" id="Player1Class">
            <p className="Player1ACC" id="Player1ACC">0.00%</p>
            <p className="Player1FC" id="Player1FC">FC</p>
            <p className="Player1Combo" id="Player1Combo">0x</p>
          </div>
          <div className="Player2Class" id="Player2Class">
            <p className="Player2ACC" id="Player2ACC">0.00%</p>
            <p className="Player2FC" id="Player2FC">FC</p>
            <p className="Player2Combo" id="Player2Combo">0x</p>
          </div>
        </div>

        {/*Tug of War*/}
        <div className="TugOfWar FadeIn" id="TugOfWar">
          <div className="LeftTugOuter">
            <div className="LeftTugInner SmoothWidth" id="LeftTug"></div>
          </div>
          <div className="RightTugOuter">
            <div className="RightTugInner SmoothWidth" id="RightTug"></div>
          </div>
        </div>

        <div id="Song">
          <div className="SongCard FadeIn" id="SongCard">
            <div className="SongBox">
              <p className="SongName" id="SongName">Really Long Song name that is...</p>
              <div className="SongInfoLeft">
                <p className="SongMapper" id="SongMapper">Mapped by NightHawk</p>
                <p className="UploadDate" id="UploadDate">Uploaded on 2021-09-01</p>
              </div>
              <div className="SongInfoRight">
                <p className="SongArtist" id="SongArtist">Lauv</p>
                <p className="SongLength" id="SongLength">3:59</p>
              </div>
              <p className="DiffName" id="DiffName">ABC</p>
              <div className="SongCover" id="SongCover"></div>
              <div className="SongBoxBG" id="SongBoxBG"></div>
            </div>
          </div>
        </div>
      </div>
      </body>
  );
}

export default App;
