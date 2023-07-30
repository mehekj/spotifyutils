import { config } from "../constants.js";

export default function Login() {
	return (
		<div>
			<h1>spotify utils</h1>
			<a href={`${config.server}/login`}>get started</a>
		</div>
	);
}
