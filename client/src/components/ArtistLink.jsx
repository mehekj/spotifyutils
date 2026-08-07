import { Anchor, Text } from "@mantine/core";

export default function ArtistLink({ uri, name, children }) {
	const parseURI = encodeURIComponent(uri);
	return uri ? (
		<Anchor to={`/artist/${parseURI}`}>{children || name || uri}</Anchor>
	) : (
		<Text>{children || name || uri}</Text>
	);
}
