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
	const [userResponse, uploadsResponse] = await Promise.all([
		api.get("/users/me"),
		api.get("/users/me/uploads/last"),
	]);
	return {
		...userResponse.data,
		lastUpload: uploadsResponse.data.lastUpload,
	};
};

export const getTopTracks = async (limit = 20) => {
	const response = await api.get(`/tracks/top?limit=${limit}`);
	return response.data;
};

export const getBottomTracks = async (limit = 20) => {
	const response = await api.get(`/tracks/bottom?limit=${limit}`);
	return response.data;
};

export const toggleLike = async (trackURI, liked) => {
	if (liked) {
		await api.delete(`/tracks/${trackURI}/like`);
	} else {
		await api.put(`/tracks/${trackURI}/like`);
	}
};

export const getLiked = async (trackURI) => {
	const response = await api.get(`/tracks/${trackURI}/like`);
	return response.data;
};

export const getTrackStreams = async (trackURI) => {
	const response = await api.get(`/tracks/${trackURI}/streams`);
	return response.data;
};
