import api from "./client";

export const users = {
	getCurrentUser: async () => {
		const [userResponse, uploadsResponse] = await Promise.all([
			api.get("/users/me"),
			api.get("/users/me/uploads/last"),
		]);

		return {
			...userResponse.data,
			lastUpload: uploadsResponse.data.lastUpload,
		};
	},
};
