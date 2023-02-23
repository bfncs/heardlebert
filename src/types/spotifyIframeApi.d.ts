declare class PlaybackUpdateEvent {
	data: {
		isPaused: boolean;
		isBuffering: boolean;
		duration: number;
		position: number;
	};
}
declare class EmbedController {
	addListener(event: "ready", cb: () => void): void;
	addListener(
		event: "playback_update",
		cb: (event: PlaybackUpdateEvent) => void
	): void;
	play(): void;
	togglePlay(): void;

	seek(positionSeconds: number): void;
	loadUri(uri: string): void;
	destroy(): void;
}

declare class IframeApi {
	createController: (
		el: any,
		options: any,
		callback: (embedController: EmbedController) => void
	) => void;
}
