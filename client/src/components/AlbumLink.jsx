import { Anchor, Text } from "@mantine/core";

export default function AlbumLink({ uri, name, children }) {
	const parseURI = encodeURIComponent(uri);
	return uri ? (
		<Anchor to={`/album/${parseURI}`}>{children || name || uri}</Anchor>
	) : (
		<Text>{children || name || uri}</Text>
	);
}
