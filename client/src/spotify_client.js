import { api } from "./api_utils";

export const login = async () => {
	const baseUrl =
		process.env.NODE_ENV === "development" ? "http://localhost:5050" : "";
	window.location.href = `${baseUrl}/auth/login`;
};

export const getUserData = async () => {
	const response = await api.get("/spotify/me");
	return response.data;
};

export const logout = async () => {
	await api.post("/auth/logout");
	window.location.reload();
};
