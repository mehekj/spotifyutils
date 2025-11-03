import axios from "axios";
import { useCallback, useEffect, useState } from "react";

export const api = axios.create({
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
	}
);

export const useApi = (requestFunc) => {
	const [data, setData] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

		const fetchData = async () => {
			setLoading(true);
			setError(null);

			try {
				const res = await requestFunc(api);
				if (isMounted) {
					setData(res.data);
				}
			} catch (err) {
				if (!err._handled && isMounted) {
					setError(err);
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		fetchData();

		return () => {
			isMounted = false;
		};
	}, [requestFunc]);

	return { data, error, loading };
};

export const useApiMutation = () => {
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);

	const mutate = useCallback(async (requestFunc) => {
		setLoading(true);
		setError(null);

		try {
			const res = await requestFunc(api);
			return res.data;
		} catch (err) {
			if (!err._handled) {
				setError(err);
			}
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	return { mutate, error, loading };
};
