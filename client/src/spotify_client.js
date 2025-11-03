import { api } from "./api_utils";

export const login = async () => {
	const baseUrl =
		process.env.NODE_ENV === "development" ? "http://localhost:5050" : "";
	window.location.href = `${baseUrl}/spotify/login`;
};

export const getUserData = async () => {
	return api.get("/spotify/user").then((res) => res.data);
};

export const logout = async () => {
	api.post("/spotify/logout").then(() => {
		window.location.reload();
	});
};
