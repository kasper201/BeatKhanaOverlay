import { useParams } from 'react-router-dom';
import { useEffect } from "react";


let playerValue: string | null = null;

function TwitchStream() {
  const { playernr } = useParams();
  return (
      <iframe
          title={`Twitch Stream player ${process.env.REACT_APP_TWITCH_CHANNEL}`}
          src={`https://player.twitch.tv/?channel=${sessionStorage.getItem(`player${playernr}`)}&height=1080&parent=${window.location.hostname}&scrolling&width=1920`}
          width="100%"
          height="100%"
          allowFullScreen={false}
      />
  );
}

export default TwitchStream;