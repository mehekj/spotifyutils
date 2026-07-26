import api from "./client";

export const artists = {
	getStreams: async (artistUri) => {
		const response = await api.get(
			`/artists/${encodeURIComponent(artistUri)}/streams`,
		);
		return response.data;
	},

	toggleFollowing: async (artistURI, following) => {
		if (following) {
			await api.delete(`/artists/${encodeURIComponent(artistURI)}/following`);
		} else {
			await api.put(`/artists/${encodeURIComponent(artistURI)}/following`);
		}
	},

	following: async (artistURI) => {
		const response = await api.get(
			`/artists/${encodeURIComponent(artistURI)}/following`,
		);
		return response.data;
	},

	getArtistInfo: async (artistUri) => {
		const response = await api.get(
			`/artists/${encodeURIComponent(artistUri)}/info`,
		);
		return response.data?.artists?.items?.[0] || response.data;
	},
};
