async function getImage(platformID) {
    try {
        const response = await fetch(`http://api.beatkhana.com/api/getUserByBeatleader/${platformID}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        if (!text) {
            throw new Error("Empty response body");
        }
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) {
            console.log(data[0]);
            return data[0].avatarurl;
        } else {
            throw new Error("Invalid response structure");
        }
    } catch (error) {
        console.error("Failed to fetch image:", error);
        return "./images/Placeholder.png"; // Fallback image
    }
}

async function setOverlay(playerIDs, playerNames, platformIDs) {
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
        player1ImageElement.src = await getImage(platformIDs[0]);
        player2ImageElement.src = await getImage(platformIDs[1]);

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