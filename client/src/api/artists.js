import api from "./client";

export const artists = {
	getStreams: async (artistName) => {
		const response = await api.get(`/artists/${artistName}/streams`);
		return response.data;
	},

	toggleFollowing: async (artistURI, following) => {
		if (following) {
			await api.delete(`/artists/${artistURI}/following`);
		} else {
			await api.put(`/artists/${artistURI}/following`);
		}
	},

	following: async (artistURI) => {
		const response = await api.get(`/artists/${artistURI}/following`);
		return response.data;
	},

	getArtistInfo: async (artistName) => {
		const response = await api.get(`/artists/${artistName}/info`);
		return response.data.artists.items[0];
	},
};
