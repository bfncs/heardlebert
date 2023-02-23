import SpotifyPlayer from "./SpotifyPlayer";
import {useState} from "react";
import {Track, tracks} from "./tracks";
import classes from "./App.module.css";

interface Props {
    spotifyIframeApi: IframeApi
}

function App(props: Props) {
    const [inputValue, setInputValue] = useState("");
    const [state, setState] = useState(
        {
            track: 0
        }
    );
    const currentTrack: Track = tracks[state.track];
    return (
        <div className="App">
            <h1>Guess this song</h1>
            <form onSubmit={event => {
                if (inputValue.toLowerCase().includes(currentTrack.title.toLowerCase())) {
                    console.log('guess correct!');
                } else {
                    console.log('guess wrong!');
                }
                setInputValue("");
                event.preventDefault();
            }
            }>
                <input className={classes.input} placeholder={"Enter your guess"} type="text" value={inputValue} onChange={event => setInputValue(event.target.value)}/>
            </form>
            <SpotifyPlayer spotifyIframeApi={props.spotifyIframeApi} uri={currentTrack.uri} stopAfterMs={1500}/>
            <button onClick={() => {
                setState({track: (state.track + 1 >= tracks.length) ? 0 : state.track + 1})
            }
            }>Skip track
            </button>
        </div>
    )
}

export default App
