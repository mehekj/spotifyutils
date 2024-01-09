import { useContext } from "react";
import { UserContext } from "../App";

export default function Home() {
	const { user } = useContext(UserContext);

	return (
		<div>
			<div>Welcome {user.display_name}!</div>
			<div>
				Your last data upload: {new Date(user.lastUpload).toLocaleString()}
			</div>
		</div>
	);
}
