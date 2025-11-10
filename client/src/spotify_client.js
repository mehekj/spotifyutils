import { api } from "./api_utils";

export const login = async () => {
	const baseUrl =
		process.env.NODE_ENV === "development" ? "http://localhost:5050" : "";
	window.location.href = `${baseUrl}/auth/login`;
};

export const logout = async () => {
	await api.post("/auth/logout");
	window.location.reload();
};

export const getUserData = async () => {
	const response = await api.get("/spotify/me");
	return response.data;
};

export const getTop20 = async () => {
	const response = await api.get("/data/top20");
	return response.data;
};

export const getBottom20 = async () => {
	const response = await api.get("/data/bottom20");
	return response.data;
};

export const toggleLike = async (trackURI, liked) => {
	const id = trackURI.split(":")[2];
	if (liked) {
		await api.delete(`/spotify/track/like?id=${id}`);
	} else {
		await api.put(`/spotify/track/like?id=${id}`);
	}
};

export const getLiked = async (trackURI) => {
	const id = trackURI.split(":")[2];
	const response = await api.get(`/spotify/track/like?id=${id}`);
	return response.data;
};

export const getTrackStreams = async (trackURI) => {
	const response = await api.get(`/data/track/streams?uri=${trackURI}`);
	return response.data;
};
