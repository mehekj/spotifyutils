const production = {
  server: "https://www.spotifyutils-backend.mehekjethani.me/",
};

const development = {
  server: "http://localhost:5050/",
};

export const config =
  process.env.NODE_ENV === "development" ? development : production;
