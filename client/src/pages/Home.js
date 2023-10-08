import { useContext } from "react";
import { UserContext } from "../App";

export default function Home() {
	const { user } = useContext(UserContext);

	return <div>Welcome {user.display_name}!</div>;
}
