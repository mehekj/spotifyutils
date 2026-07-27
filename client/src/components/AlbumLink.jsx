import { Anchor } from "@mantine/core";

export default function AlbumLink({ uri, name, children }) {
	return (
		<Anchor to={`/album/${encodeURIComponent(uri)}`}>
			{children || name || uri}
		</Anchor>
	);
}
