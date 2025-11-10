import api from "./client";

export const auth = {
	login: () => {
		const baseURL =
			process.env.NODE_ENV === "development" ? "http://localhost:5050" : "";
		window.location.href = `${baseURL}/auth/login`;
	},

	logout: async () => {
		await api.post("/auth/logout");
		window.location.reload();
	},
};
