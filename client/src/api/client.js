import axios from "axios";

const api = axios.create({
	withCredentials: true,
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		const status = error.response?.status;
		const noRedirect = error.config?.noRedirect;

		if (status === 401 && !noRedirect) {
			error._handled = true;

			if (window.location.pathname !== "/") {
				window.location.href = "/";
			}
		}

		return Promise.reject(error);
	},
);

export default api;
