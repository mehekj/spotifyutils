import api from "./client";

export const albums = {
	getAlbumInfo: async (albumUri) => {
		const response = await api.get(
			`/albums/${encodeURIComponent(albumUri)}/info`,
		);
		return response.data?.albums?.items?.[0] || response.data;
	},

	getStreams: async (albumUri) => {
		const response = await api.get(
			`/albums/${encodeURIComponent(albumUri)}/streams`,
		);
		return response.data;
	},
};
