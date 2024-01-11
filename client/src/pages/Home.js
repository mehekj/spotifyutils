import { useContext, useEffect, useState } from "react";
import { UserContext } from "../App";
import { getTop20 } from "../spotify";

export default function Home() {
	const { user } = useContext(UserContext);
	const [top20, setTop20] = useState([]);

	useEffect(() => {
		if (user) {
			const fetchTop20 = async () => {
				getTop20(user.id).then((res) => setTop20(res.data));
			};
			fetchTop20().catch((err) => console.error(err));
		}
	}, [user]);

	return (
		<div>
			<div>Welcome {user.display_name}!</div>
			<div>
				Your last data upload: {new Date(user.lastUpload).toLocaleString()}
			</div>
			<div>{JSON.stringify(top20)}</div>
		</div>
	);
}
