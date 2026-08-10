import { artists } from "./conn.js";

export const getArtistInfo = async (uri) => {
	try {
		const artistInfo = await artists.findOne({ _id: uri });
		return artistInfo;
	} catch (error) {
		throw new MongoAPIError("Failed to get artist info", 500, error);
	}
};
