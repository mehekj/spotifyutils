import { Anchor } from "@mantine/core";

export default function ArtistLink({ name, children }) {
	return (
		<Anchor to={`/artist?name=${encodeURIComponent(name)}`}>
			{children || name}
		</Anchor>
	);
}
