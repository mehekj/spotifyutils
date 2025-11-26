import { useEffect, useState } from "react";
import { users } from "../api";
import { UserContext } from "../UserContext";

export default function UserProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		users
			.getCurrentUser()
			.then((u) => setUser(u))
			.catch((err) => {
				if (!err._handled) console.error("Error loading user:", err);
			})
			.finally(() => setLoading(false));
	}, []);

	return (
		<UserContext.Provider value={{ user, loading, setUser }}>
			{children}
		</UserContext.Provider>
	);
}
