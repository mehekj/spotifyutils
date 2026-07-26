import { Anchor } from "@mantine/core";

export default function AlbumLink({ uri, name, children }) {
	const targetUri = uri || name;
	return (
		<Anchor to={`/album?uri=${encodeURIComponent(targetUri)}`}>
			{children || name || uri}
		</Anchor>
	);
}
