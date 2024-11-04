// Import the npmjs package
import { Response_ResponseType, TAClient } from 'moons-ta-client';
// import { isAsyncFunction } from "node:util/types";

let client = null;
let myTourney = null;

// Define the getTourneyInfo function at the top level
async function getTourneyInfo() {

    // Disconnect the TA client
    // client.disconnect();
}

// Export the function to make it available globally
export { getTourneyInfo };