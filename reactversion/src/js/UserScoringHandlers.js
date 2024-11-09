import {playerIDs, setPlayerInfo} from "./MainHandlers.js";
import {User_ClientTypes} from "moons-ta-client";
import {setOverlay} from "./OverlayHandlers";

export let playerScore = [0, 0];
export let playerAcc = [0.0, 0.0];
export let playerCombo = [0, 0];
export let playerWinScore = [0, 0];
function scoreUpdate(player, score, combo, acc, misses, reset, songPosition) {
	if (playerIDs[0] === player) {
		updatePlayerData(0, score, combo, acc, misses);
	} else if (playerIDs[1] === player) {
		updatePlayerData(1, score, combo, acc, misses);
	}

	if (player === 0 && reset === 1) {
		resetAllPlayers();
	}
}

function updatePlayerData(index, score, combo, acc, misses) {
	playerAcc[index] = (acc * 100).toFixed(2);
	playerCombo[index] = combo;
	playerScore[index] = score;
	// playerMisses[index] = misses;

	updateTug();

	document.getElementById(`Player${index + 1}Combo`).innerHTML = playerCombo[index] + "x";
	document.getElementById(`Player${index + 1}ACC`).innerHTML = playerAcc[index] + "%";
	document.getElementById(`Player${index + 1}FC`).innerHTML = playerScore[index];

	// if (misses >= 1) {
	// 	document.getElementById(`Player${index + 1}FC`).style.color = "#d15252";
	// 	document.getElementById(`Player${index + 1}FC`).innerHTML = playerMisses[index] + "x";
	// 	playerFC[index] = false;
	// } else {
	// 	playerFC[index] = true;
	// 	document.getElementById(`Player${index + 1}FC`).style.color = "#ffffff";
	// 	document.getElementById(`Player${index + 1}FC`).innerHTML = "FC";
	// }
}
function resetAllPlayers() {
	// playerFC = [true, true];
	playerScore = [0, 0];
	playerAcc = [0, 0];
	playerCombo = [0, 0];
	playerWinScore = [0, 0];
	playerIDs = [0, 0];
	// playerMisses = [0, 0];

	updateTug();

	for (let i = 0; i < 2; i++) {
		// document.getElementById(`Player${i + 1}FC`).style.color = "#ffffff";
		// document.getElementById(`Player${i + 1}FC`).innerHTML = "FC";
		document.getElementById(`Player${i + 1}Combo`).innerHTML = "0x";
		document.getElementById(`Player${i + 1}ACC`).innerHTML = "0.00%";
	}
}

function updateTug() {
	// to see the utilised formula check https://www.desmos.com/calculator/a8iurzdxea
	const diff = playerAcc[1] - playerAcc[0]; // calculate the difference in percentage
	const minDiff = 0.05;
	const base= 4.3; // logarithmic scale used.

	const logMinDiffBase = Math.log(minDiff) / Math.log(base);
	const logScale = Math.log(Math.max(minDiff,Math.abs(diff)))/Math.log(base); // apply scale
	const percentage = ((logScale-logMinDiffBase)*(1/Math.log(base)-logMinDiffBase))+Math.abs(diff*1.8); // calculate percentage (0-100)

	const leftTug = document.getElementById("LeftTug");
	const rightTug = document.getElementById("RightTug");

	if (playerAcc[0] === playerAcc[1]) {
		leftTug.style.width = "0%"
		rightTug.style.width = "0%";
		return;
	}

	if (diff < 0) {
		rightTug.style.width = "0%";
		leftTug.style.width = `${percentage}%`;
		document.getElementById(`Player1ACC`).style.fontSize = ((1+(Math.abs(diff)/400)) * 47) + "px";
		document.getElementById(`Player2ACC`).style.fontSize = ((1-(0.1-diff/800)) * 47) + "px";
		return;
	} else if (diff > 0) {
		leftTug.style.width = "0%";
		rightTug.style.width = `${percentage}%`;
		document.getElementById(`Player1ACC`).style.fontSize = ((1-(0.1-diff/800)) * 47) + "px";
		document.getElementById(`Player2ACC`).style.fontSize = ((1+(Math.abs(diff)/400)) * 47) + "px";
		return;
	} else {
		leftTug.style.width = "0%"
		rightTug.style.width = "0%";
		document.getElementById(`Player1ACC`).style.fontSize = 47 + "px";
		document.getElementById(`Player2ACC`).style.fontSize = 47 + "px";
		return;
	}
}

function updateScores(user, score)
{

}

function userWinScore(player)
{
	if(playerIDs[0] === player) {
		playerWinScore[player] += 1;
	} else if(playerIDs[1] === player) {
		playerWinScore[player] += 1;
	} else {
		console.error("Invalid player ID");
	}

}

export { scoreUpdate, updatePlayerData, resetAllPlayers, updateTug, userWinScore };