import axios from "axios";

export const getUserData = async () => {
	return axios.get("/spotify/user").then((res) => res.data);
};

export const logout = async () => {
	axios.post("/spotify/logout").then(() => {
		console.log("Logged out successfully");
		window.location.reload();
	});
};
