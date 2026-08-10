import { albums } from "./conn.js";

export const getAlbumInfo = async (uri) => {
	try {
		const albumInfo = await albums.findOne({ _id: uri });
		return albumInfo;
	} catch (error) {
		throw new MongoAPIError("Failed to get album info", 500, error);
	}
};
