import api from "./client";

export const tracks = {
	getTop: async (limit = 20) => {
		const response = await api.get(`/tracks/top?limit=${limit}`);
		return response.data;
	},

	getBottom: async (limit = 20) => {
		const response = await api.get(`/tracks/bottom?limit=${limit}`);
		return response.data;
	},

	getStreams: async (trackURI) => {
		const response = await api.get(`/tracks/${trackURI}/streams`);
		return response.data;
	},

	toggleLike: async (trackURI, liked) => {
		if (liked) {
			await api.delete(`/tracks/${trackURI}/like`);
		} else {
			await api.put(`/tracks/${trackURI}/like`);
		}
	},

	isLiked: async (trackURI) => {
		const response = await api.get(`/tracks/${trackURI}/like`);
		return response.data;
	},
};
