import api from "./client";

export const auth = {
	login: () => {
		const baseURL = import.meta.env.DEV ? "http://localhost:5050" : "";
		window.location.href = `${baseURL}/auth/login`;
	},

	logout: async () => {
		await api.post("/auth/logout");
		window.location.reload();
	},
};
