import { Anchor } from "@mantine/core";

export default function TrackLink({ uri, children }) {
	return (
		<Anchor to={`/track?uri=${encodeURIComponent(uri)}`}>
			{children || uri}
		</Anchor>
	);
}
