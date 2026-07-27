import { Anchor } from "@mantine/core";

export default function ArtistLink({ uri, name, children }) {
	return (
		<Anchor to={`/artist/${encodeURIComponent(uri)}`}>
			{children || name || uri}
		</Anchor>
	);
}
