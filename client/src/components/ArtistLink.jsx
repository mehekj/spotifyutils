import { Anchor } from "@mantine/core";

export default function ArtistLink({ uri, name, children }) {
	const targetUri = uri || name;
	return (
		<Anchor to={`/artist?uri=${encodeURIComponent(targetUri)}`}>
			{children || name || uri}
		</Anchor>
	);
}
