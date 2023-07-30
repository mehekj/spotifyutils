import axios from "axios";
import { config } from "./constants.js";

const LOCAL_KEYS = {
	accessToken: "spotify_access_token",
	refreshToken: "spotify_refresh_token",
	expireTime: "spotify_token_expire_time",
	timestamp: "spotify_token_timestamp",
};

const LOCAL_VALUES = {
	accessToken: window.localStorage.getItem(LOCAL_KEYS.accessToken),
	refreshToken: window.localStorage.getItem(LOCAL_KEYS.refreshToken),
	expireTime: window.localStorage.getItem(LOCAL_KEYS.expireTime),
	timestamp: window.localStorage.getItem(LOCAL_KEYS.timestamp),
};

export const logout = () => {
	for (const property in LOCAL_KEYS) {
		window.localStorage.removeItem(LOCAL_KEYS[property]);
	}

	window.location = window.location.origin;
};

const refreshToken = async () => {
	try {
		if (
			!LOCAL_VALUES.refreshToken ||
			LOCAL_VALUES.refreshToken === "undefined" ||
			Date.now() - Number(LOCAL_VALUES.timestamp) / 1000 < 1000
		) {
			console.error("No refresh token available");
			logout();
		}

		const { data } = await axios.get(
			`${config.server}/refresh_token?refresh_token=${LOCAL_VALUES.refreshToken}`
		);

		window.localStorage.setItem(LOCAL_KEYS.accessToken, data.access_token);
		window.localStorage.setItem(LOCAL_KEYS.timestamp, Date.now());

		window.location.reload();
	} catch (err) {
		console.error(err);
	}
};

const hasTokenExpired = () => {
	const { accessToken, timestamp, expireTime } = LOCAL_VALUES;
	if (!accessToken || !timestamp) {
		return false;
	}

	const millisecondsElapsed = Date.now() - Number(timestamp);
	return millisecondsElapsed / 1000 > Number(expireTime);
};

const getAccessToken = () => {
	const urlParams = new URLSearchParams(window.location.search);
	const queryParams = {
		[LOCAL_KEYS.accessToken]: urlParams.get("access_token"),
		[LOCAL_KEYS.refreshToken]: urlParams.get("refresh_token"),
		[LOCAL_KEYS.expireTime]: urlParams.get("expires_in"),
	};

	if (
		urlParams.get("error") ||
		hasTokenExpired() ||
		LOCAL_VALUES.accessToken === "undefined"
	) {
		refreshToken();
	}

	if (LOCAL_VALUES.accessToken && LOCAL_VALUES.accessToken !== "undefined") {
		return LOCAL_VALUES.accessToken;
	}

	if (queryParams[LOCAL_KEYS.accessToken]) {
		for (const property in queryParams) {
			window.localStorage.setItem(property, queryParams[property]);
		}

		window.localStorage.setItem(LOCAL_KEYS.timestamp, Date.now());

		return queryParams[LOCAL_KEYS.accessToken];
	}
};

export const accessToken = getAccessToken();
