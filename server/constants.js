const production = {
	client: "https://spotifyutils.mehekjethani.me",
	server: "https://spotifyutils-backend.mehekjethani.me",
};

const development = {
	client: "http://localhost:3000",
	server: "http://localhost:5050",
};

export const config =
	process.env.NODE_ENV === "development" ? development : production;
