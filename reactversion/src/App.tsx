import React from 'react';
import './App.css';

// import all handles
import { playerNames, playerIDs, setPlayerInfo } from './js/MainHandlers.js';
import './js/FormatHandlers.js';
import { songData, getMap } from './js/MapHandlers.js';
import { resetAllPlayers, scoreUpdate, userWinScore, handleSkip, handleReplay } from "./js/UserScoringHandlers";

import { getTwitchID, setOverlay } from './js/OverlayHandlers.js';

// TA client thingy
import { Tournament, Match, Response_ResponseType, TAClient, User_ClientTypes } from 'moons-ta-client';
import { wait } from "@testing-library/user-event/dist/utils";
import { useTAClient } from './useTAClient';
import {unsubscribe} from "node:diagnostics_channel";

// Ensure Twitch is available globally
declare global {
  interface Window {
    Twitch: any;
    switchAudio: () => void;
    setPlayerChannels: (player1Channel: string, player2Channel: string) => void;
  }
}

let nextMatchNr = 0;
let currentMatch: Match;

function App() {
  const handleButton = (player: any, action: any) => {
    if (action === "skip") {
      console.log("Player " + player + " skipped");
      handleSkip(player);
    }
    else {
      console.log("Player " + player + " replayed");
      handleReplay(player);
    }
  };
  let taHook = useTAClient();
  
  // garbage name but I needed smt
  async function connectToMatch(myTourney: Tournament, matchID?: string)
  {
    let match = taHook.taClient.current!.stateManager.getMatch(myTourney.guid, matchID!)!;
    await taHook.taClient.current!.addUserToMatch(myTourney.guid, match.guid, taHook.taClient.current!.stateManager.getSelfGuid());
    // maybe error check? NAHH
    let users = taHook.taClient.current!.stateManager.getUsers(myTourney.guid)!.filter(x => match.associatedUsers.includes(x.guid) && x.clientType === User_ClientTypes.Player);
    if (users.length === 0) return;
    console.log(users);
    setPlayerInfo(users.map(x => x.guid), users.map(x => x.name));
    await setOverlay(users.map(x => x.guid), users.map(x => x.name), users.map(x => x.platformId));
    currentMatch = match;
  }
  async function addSelfToMatch(playerName: string | undefined) {
    console.log("Add self to match");
    const myTourney = taHook.taClient.current!.stateManager.getTournaments().find(x => x.settings?.tournamentName === "Moon's Test Tourney");
    
    if (!myTourney) {
      console.error(`Could not find tournament with name ${'Moon\'s Test Tourney'}`);
      return;
    }
    
    // TODO: Remove self from match if already in one!!!
    myTourney.matches?.forEach(match => {
        if (match.associatedUsers.includes(taHook.taClient.current!.stateManager.getSelfGuid())) {
          // remove self from match
          console.log("Removing self from match")
          taHook.taClient.current!.removeUserFromMatch(myTourney.guid, match.guid, taHook.taClient.current!.stateManager.getSelfGuid());
        }
    });
    
    if (!(taHook.taClient.current!.stateManager.getMatches(myTourney.guid) !== undefined && taHook.taClient.current!.stateManager.getMatches(myTourney.guid)!.length > 0)) {
      return;
    }
    if(playerName === undefined) {
      let matchID = taHook.taClient.current!.stateManager.getMatches(myTourney.guid)![0].guid;
      await connectToMatch(myTourney, matchID);
      return;
    }
    for (let i = 0; i < taHook.taClient.current!.stateManager.getMatches(myTourney.guid)!.length; i++) {
      if (taHook.taClient.current!.stateManager.getMatches(myTourney.guid)![i].associatedUsers[0].toLowerCase() === playerName || taHook.taClient.current!.stateManager.getMatches(myTourney.guid)![i].associatedUsers[1].toLowerCase() === playerName) {
        await connectToMatch(myTourney, taHook.taClient.current!.stateManager.getMatches(myTourney.guid)![i].guid);
        break;
      }
    }
  }
  
  async function chooseMatch()
  {
    let matches: HTMLButtonElement | undefined = undefined
    console.log("Choose match");
    const myTourney = taHook.taClient.current!.stateManager.getTournaments().find(x => x.settings?.tournamentName === "Moon's Test Tourney")!;
	
    if (!myTourney) {
      console.error(`Could not find tournament with name ${'Moon\'s Test Tourney'}`);
      return;
    }
    myTourney.matches?.forEach(match => {
        const tourneyPlayers = taHook.taClient.current!.stateManager.getUsers(myTourney.guid)!;
        const matchPlayers = tourneyPlayers.filter(x => x.clientType === User_ClientTypes.Player && match.associatedUsers.includes(x.guid));
        console.log(match.associatedUsers[0] + " vs " + match.associatedUsers[1]);
		matches = document.createElement('button');
        matches.className = "matchButton";
        matches.innerHTML = matchPlayers[0]?.name + " vs " + matchPlayers[1]?.name;
        matches.onclick = () => {
          connectToMatch(myTourney, match.guid);
          let chooseMatchbtn = document.getElementsByClassName("matchButton");
          for(let i = 0; i < chooseMatchbtn.length; i++) {
            chooseMatchbtn[i].remove();
          }
        }
    })
    if(matches === undefined) return;
    document.getElementById("chooseMatch")?.appendChild(matches);
  }
  
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
    
    console.log("Subscribing to TA client events");
    
    const unsubscribeFromTAConnected = taHook.subscribeToTAConnected(() => {
      addSelfToMatch(undefined);
    });
    
    const unsubscribeFromRealtimeScores = taHook.subscribeToRealtimeScores((score) => {
      console.log(score);
      scoreUpdate(score.userGuid, score.score, score.combo, score.accuracy, score.notesMissed, 0, score.songPosition);
    });
    
    const unsubscribeFromSongFinished = taHook.subscribeToSongFinished((songFinished) => {
      console.log("Song finished");
      let userScores: { userGuid: string | undefined, score: number } = { userGuid: "", score: 0 };
      
      if (songFinished.matchId !== currentMatch?.guid) return;
      if (userScores.userGuid === "") {
        userScores = { userGuid: songFinished.player!.guid, score: songFinished.score };
      }
      if (userScores.score < songFinished.score) {
        userWinScore(songFinished.player!.guid);
        userScores = { userGuid: "", score: 0 };
      }
      else {
        userWinScore(userScores.userGuid);
        userScores = { userGuid: "", score: 0 };
      }
    });
    
    const unsubscribeFromFailedToCreateMatch = taHook.subscribeToFailedToCreateMatch(() => {
      console.log("failed to create Match");
    });
    
    const unsubscribeFromMatchCreated = taHook.subscribeToMatchCreated(([match, tournament]) => {
      console.log("Created match");
      if (currentMatch === undefined) {
        console.log("Match created");
        addSelfToMatch(undefined);
      }
    });
    
    const unsubscribeFromMatchUpdated = taHook.subscribeToMatchUpdated(([match, tournament]) => {
      console.log("Updated match");
      if(currentMatch?.guid !== match.guid) return;
      let levelID = match.selectedMap?.gameplayParameters?.beatmap?.levelId.toLowerCase().slice(13);
      let levelDiff = match.selectedMap?.gameplayParameters?.beatmap?.difficulty;
      getMap(levelID, levelDiff);
    });
    
    const unsubscribeFromMatchDeleted = taHook.subscribeToMatchDeleted(([match, tournament]) => {
      console.log("Deleted match");
      if (currentMatch?.guid === match?.guid) {
        // currentMatch = undefined;
        resetAllPlayers();
      }
    });
    
    return () => {
      console.log("Unsubscribing from TA client events");
      
      unsubscribeFromTAConnected();
      unsubscribeFromRealtimeScores();
      unsubscribeFromSongFinished();
      unsubscribeFromFailedToCreateMatch();
      unsubscribeFromMatchCreated();
      unsubscribeFromMatchUpdated();
      unsubscribeFromMatchDeleted();
    };
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
              <img src="../public/images/Placeholder.png" className="Player1Image" id="Player1Image" />
            </div>
          </div>
          <div className="LogoSpot" id="LogoContainer">
          </div>
          <div className="Player2Container" id="Player2Container">
            <div className="imageContainer2" id="imageContainer2">
              <img src="../public/images/Placeholder.png" className="Player2Image" id="Player2Image" />
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
          <button
              className={"chooseMatch"}
              id={"chooseMatch"}
              onClick={() => {
                console.log("Choose match button pressed");
                chooseMatch();
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