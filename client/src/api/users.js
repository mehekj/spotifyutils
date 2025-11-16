import api from "./client";

export const users = {
	getCurrentUser: async () => {
		const [userResponse, uploadsResponse] = await Promise.all([
			api.get("/users/me"),
			api.get("/users/me/uploads/last"),
		]);

		return {
			...userResponse.data,
			lastUpload: uploadsResponse.data.lastUpload ?? null,
		};
	},

	setLastUpload: async (uploadTime) => {
		await api.put(`/users/me/uploads/last?time=${uploadTime}`);
	},

	uploadFileChunk: async (formData) => {
		await api({
			method: "post",
			url: "/users/me/data",
			data: formData,
			headers: { "Content-Type": "multipart/form-data" },
		});
	},

	deleteOldUpload: async (uploadTime) => {
		await api.delete(`/users/me/data?time=${uploadTime}`);
	},
};
