export const getUserData = async () => {
	return fetch("/spotify/user").then((res) => res.json());
};
