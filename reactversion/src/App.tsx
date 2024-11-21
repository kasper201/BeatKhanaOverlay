import React from 'react';
import './App.css';

// import all handles
import {playerNames, playerIDs, setPlayerInfo} from './js/MainHandlers.js';
import './js/FormatHandlers.js';
import { songData, getMap } from './js/MapHandlers.js';
import {resetAllPlayers, scoreUpdate, userWinScore, handleSkip, handleReplay} from "./js/UserScoringHandlers";

import {getTwitchID, setOverlay} from './js/OverlayHandlers.js';

// TA client thingy
import {Tournament, Match, Response_ResponseType, TAClient, User_ClientTypes} from 'moons-ta-client';
import {wait} from "@testing-library/user-event/dist/utils";

// Ensure Twitch is available globally
declare global {
  interface Window {
    Twitch: any;
    switchAudio: () => void;
    setPlayerChannels: (player1Channel: string, player2Channel: string) => void;
  }
}

const taToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjRFOTc0RUE5RTk4RkI5MzJFRUNBOEEyODc0MjBBOThCMjg4M0JEREIiLCJ4NXQiOiJUcGRPcWVtUHVUTHV5b29vZENDcGl5aUR2ZHMiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOiIxNzMyMDQ5ODMyIiwiZXhwIjoiMjA0NzU4MjYzMiIsInRhOmRpc2NvcmRfaWQiOiI5ZTQ3NWI2NS0wOWVhLTQxN2ItOTllNS0zZjhhMWE2ZWQ5NTkiLCJ0YTpkaXNjb3JkX25hbWUiOiJmbGl0c8K0cyB0ZXN0IGJvdCIsInRhOmRpc2NvcmRfYXZhdGFyIjoiIiwiaXNzIjoidGFfc2VydmVyIiwiYXVkIjoidGFfdXNlcnMifQ.m25DO2yaJViVrI91af0bJjilS5PnKFbPl1_h6KQcOAN9wFGb-pQJBIj2eqN6OHnI930CMgC4t9homl8abUQbHGxN87kIpW0030l4EORWtpPwQuZRl1kurx3-Cda2zuEwrs4EThWVGZyHZepV-243vDrZ5jorS4a_41WlOODY0Jbii2zK96wO-ztmIwvvsDNmQ-7LzUNgcktZdEFjXrqMuCL8NB8g6JFjuRkjpHD8u_Ja7hb6b4TDVR1m9jduakoCrsBMzSTdUEPhFPE7TPzhD-SFjE7IKCJGw1uJd7t8gxlgClS_ljdmY_OI5ckfuHyKCQy3eSBHmXNT6LyzbdK9nA";

let myTourney: Tournament;
export let client: TAClient;
let nextMatchNr = 0;
let currentMatch: Match;

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
    console.log("users");
    if (users.length === 0) return;
    console.log(users);
    setPlayerInfo(users.map(x => x.guid), users.map(x => x.name));
    await setOverlay(users.map(x => x.guid), users.map(x => x.name), users.map(x => x.platformId));
    currentMatch = match;
  } else {
    console.log("No matches found");
  }
}

async function nextMatch()
{
  // for (const match of client.stateManager.getMatches(myTourney.guid)!){
  //   await client.removeUserFromMatch(myTourney.guid, match.guid, client.stateManager.getSelfGuid());
  // }
  console.log(currentMatch);
  if(currentMatch === undefined) await addUsers(client, myTourney, nextMatchNr);
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
    const loadTwitchScript = () => {
      return new Promise((resolve, reject) => {
        if (document.getElementById('twitch-embed-script')) {
          return;
        }
        const script = document.createElement('script');
        script.id = 'twitch-embed-script';
        script.src = "https://player.twitch.tv/js/embed/v1.js";
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };


    const initializeTwitchPlayers = () => {
      const player1 = new window.Twitch.Embed("player1Video", {
        width: "120%",
        height: "120%",
        channel: "yetanotherbt",
        layout: "video",
        autoplay: true,
        muted: false,
        parent: [window.location.hostname]
      });

      const player2 = new window.Twitch.Embed("player2Video", {
        width: "120%",
        height: "120%",
        channel: "yetanotherbt",
        layout: "video",
        autoplay: true,
        muted: true,
        parent: [window.location.hostname]
      });

      // Function to switch audio between players
      function switchAudio() {
        const isPlayer1Muted = player1.getMuted();
        player1.setMuted(!isPlayer1Muted);
        player2.setMuted(isPlayer1Muted);
      }

      function setPlayerChannels(player1Channel: string, player2Channel: string) {
        player1.setChannel(player1Channel);
        player2.setChannel(player2Channel);
      }

      window.setPlayerChannels = setPlayerChannels;
      window.switchAudio = switchAudio;
    };

    loadTwitchScript().then(initializeTwitchPlayers).catch((error) => {
        console.error("Failed to load Twitch script:", error);
      });

    // document.getElementById("Logo").src = 'url(${window.location.origin}/images/Logo.png)';

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
          if(currentMatch?.guid === match?.guid) {
            let levelID = match.selectedMap?.gameplayParameters?.beatmap?.levelId.toLowerCase().slice(13);
            let levelDiff = match.selectedMap?.gameplayParameters?.beatmap?.difficulty;
            getMap(levelID, levelDiff);
          } else {
            console.log("Not current match");
          }
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
            // resetAllPlayers();
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

        // Add users to the match
        setTaClient(client);
        addUsers(client, myTourney, nextMatchNr);
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
            <img src="" className="Logo" id="Logo"/>
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
          <button className={"MuteButton"} id={"MuteButton"} onClick={() => {
            console.log("Mute button pressed");
            window.switchAudio();
          }}></button>

        </div>

        {/* Streams */}
        <div className="videoContainer">
          <div id="player1Video"></div>
          <div id="player2Video"></div>
        </div>

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
                <p className="SongMapper" id="SongMapper">Mapped by BeatKhana</p>
                <p className="UploadDate" id="UploadDate">Uploaded on 2000-11-23</p>
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