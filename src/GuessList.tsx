import classes from "./Game.module.scss";
import React from "react";

interface ExternalProps {
	guesses: string[];
}

export const GuessList = (props: ExternalProps) => {
	return (
		<ol className={classes.guessList}>
			{props.guesses.map((guess, index) => (
				<li key={index} className={classes.guessListItem}>
					{index + 1 + ". " + guess}
				</li>
			))}
		</ol>
	);
};
