import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

declare global {
    interface Window {
        onSpotifyIframeApiReady: (api: IframeApi) => void
    }
}


window.onSpotifyIframeApiReady = window.onSpotifyIframeApiReady || {};

window.onSpotifyIframeApiReady = (spotifyIframeApi) => {
    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
        <React.StrictMode>
            <App spotifyIframeApi={spotifyIframeApi} />
        </React.StrictMode>,
    )
};

const s = document.createElement( 'script' );
s.setAttribute( 'src', "https://open.spotify.com/embed-podcast/iframe-api/v1" );
document.body.appendChild( s );