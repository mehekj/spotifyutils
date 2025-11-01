import axios from "axios";

export const login = async () => {
	const baseUrl =
		process.env.NODE_ENV === "development" ? "http://localhost:5050" : "";

	window.location.href = `${baseUrl}/spotify/login`;
};

export const getUserData = async () => {
	return axios.get("/spotify/user").then((res) => res.data);
};

export const logout = async () => {
	axios.post("/spotify/logout").then(() => {
		console.log("Logged out successfully");
		window.location.reload();
	});
};
