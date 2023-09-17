import { getUserData } from "../spotify";
import { useEffect, useState } from "react";

export default function Home() {
	const [user, setUser] = useState({});

	useEffect(() => {
		const fetchUser = async () => {
			getUserData().then((res) => setUser(res.data));
		};

		fetchUser().catch((err) => console.error(err));
	}, []);

	return <div>Welcome {user.display_name}!</div>;
}
