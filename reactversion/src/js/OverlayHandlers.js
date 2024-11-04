// import App from "../App";
// async function setOverlay(playerIDs, playerNames) {
//     playerIDs = [playerIDs[0], playerIDs[1]];
//     document.getElementById("player1Name").innerText = playerNames[0];
// 	// document.getElementById("TextBox").style.opacity = "0";
// 	// fetch('https://skillsaber.vercel.app/api/player?id=' + playerIDs[0])
// 	// 	.then(response => response.json())
// 	// 	.then(data => {
// 	// 		document.getElementById("Player1Image").src = data.profilePicture;
// 	// 		document.getElementById("Player1Name").innerText = playerNames[0];
// 	// 		document.getElementById("Player1Name").style.opacity = '1';
// 	// 	});
// 	// fetch('https://skillsaber.vercel.app/api/player?id=' + playerIDs[1])
// 	// 	.then(response => response.json())
// 	// 	.then(data => {
// 	// 		document.getElementById("Player2Image").src = data.profilePicture;
// 	// 		document.getElementById("Player2Name").innerText = playerNames[1];
// 	// 		document.getElementById("Player2Name").style.opacity = '1';
// 	//
// 	// 		document.getElementById("PlayerContainers").style.opacity = 1;
// 	// 		document.getElementById("PlayerBounds").style.opacity = 1;
// 	// 		document.getElementById("TugOfWar").style.opacity = 1;
// 	// 		// document.getElementById("TextBox").style.opacity = "1";
// 	// 	});
// }
//
// export { setOverlay };
async function setOverlay(playerIDs, playerNames) {
    playerIDs = [playerIDs[0], playerIDs[1]];

    const player1ImageElement = document.getElementById("Player1Image");
    const player1NameElement = document.getElementById("Player1Name");

    const player2ImageElement = document.getElementById("Player2Image");
    const player2NameElement = document.getElementById("Player2Name");

    const playerContainersElement = document.getElementById("PlayerContainers");
    const playerBoundsElement = document.getElementById("PlayerBounds");
    const tugOfWarElement = document.getElementById("TugOfWar");

    if (player1NameElement && player2NameElement) {
        // set player names

        player1NameElement.innerText = playerNames[0];
        player1NameElement.style.opacity = '1';

        // set player images

        player2NameElement.innerText = playerNames[1];
        player2NameElement.style.opacity = '1';

        // set player containers
        playerContainersElement.style.opacity = '1';
        playerBoundsElement.style.opacity = '1';
        tugOfWarElement.style.opacity = '1';
    } else {
        console.error("Player name elements not found in the DOM");
    }

    // Additional code to fetch and update player images and other elements
}

export { setOverlay };