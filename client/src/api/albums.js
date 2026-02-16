import api from "./client";

export const albums = {
	getAlbumInfo: async (albumId) => {
		const response = await api.get(`/albums/${albumId}/info`);
		return response.data.albums.items[0];
	},

	getStreams: async (albumId) => {
		const response = await api.get(`/albums/${albumId}/streams`);
		return response.data;
	},
};
