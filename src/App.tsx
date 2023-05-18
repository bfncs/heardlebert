import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import GameMenu from "./GameMenu";
import Game from "./Game";
import classes from "./App.module.scss";

interface Props {
	spotifyIframeApi: IframeApi;
}

function App(props: Props) {
	return (
		<div className={classes.app}>
			<div className={classes.header}>
				<h1>
					<b>Heardlebert 2.0</b>
				</h1>
			</div>
			<div className={classes.appBody}>
				<Router>
					<Routes>
						<Route path="/" element={<GameMenu />} />
						<Route
							path="/game"
							element={<Game spotifyIframeApi={props.spotifyIframeApi} />}
						/>
					</Routes>
				</Router>
			</div>
			<div className={classes.footer}>
				<p>Developed at metropolis with love &#128522;️</p>
			</div>
		</div>
	);
}

export default App;
