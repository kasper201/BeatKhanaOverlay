// Import the npmjs package
import { Response_ResponseType, TAClient } from 'moons-ta-client';
// import { isAsyncFunction } from "node:util/types";

// Define the getTourneyInfo function at the top level
async function getTourneyInfo() {
    // Create a tournament assistant client
    const client = new TAClient();

    // Set the authorisation token to readonly
    client.setAuthToken("readonly");

    // Connect to the tournamentassistant server
    const response = await client.connect("server.tournamentassistant.net", "8676");
    console.log(response);

    // Check if the connection is successful and the auth token is valid
    if (response.details.oneofKind === "connect" && response.type !== Response_ResponseType.Success) {
        console.log(response.details.connect.message); // Provide user with error message if connection is unsuccessful
    }

    // Fetch the list of tournaments within the server
    const tournaments = await client.stateManager.getTournaments();

    // Create a tournament instance which we will then use
    const myTourney = tournaments.find(x => x.settings?.tournamentName === "Moon's Test Tourney");

    // Join the tournament
    if (myTourney) {
        await client.joinTournament(myTourney.guid);
    } else {
        console.log("No tournament found with that name");
    }

    // Check if the tournament exists
    if (!myTourney) {
        console.log("No tournament found with that name");
    } else {
        // Print the currently connected users
        console.log(myTourney.users);
        console.log(myTourney.matches);
    }

    // Disconnect the TA client
    client.disconnect();
}

// Export the function to make it available globally
export { getTourneyInfo };