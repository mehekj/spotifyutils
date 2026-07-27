import { Table, Text } from "@mantine/core";
import AlbumLink from "./AlbumLink";
import ArtistLink from "./ArtistLink";
import LikeButton from "./LikeButton";
import TrackLink from "./TrackLink";

export default function JSONTable({ data, keys = null }) {
	const getTrackUri = (row) => {
		return row.spotify_track_uri || null;
	};

	const getLiked = (row) => {
		return row.liked || false;
	};

	const getTrackName = (row) => {
		return row.name || row.track?.name || null;
	};

	const getArtists = (row) => {
		return row.artists || row.track?.artists || [];
	};

	const getAlbum = (row) => {
		return row.album || row.track?.album || null;
	};

	const cell = (row, key) => {
		switch (key) {
			case "liked":
				return <LikeButton uri={getTrackUri(row)} like={getLiked(row)} />;
			case "track":
				return (
					<TrackLink uri={getTrackUri(row)}>{getTrackName(row)}</TrackLink>
				);
			case "artist":
				return getArtists(row).map((artist, idx) => (
					<span key={artist.uri || artist.name || idx}>
						<ArtistLink uri={artist.uri} name={artist.name} />
						{idx < getArtists(row).length - 1 && ", "}
					</span>
				));
			case "album":
				return (
					<AlbumLink uri={getAlbum(row)?.uri} name={getAlbum(row)}>
						{getAlbum(row)?.name}
					</AlbumLink>
				);
			default:
				return <Text>{row[key] ?? ""}</Text>;
		}
	};

	return (
		<Table tabularNums>
			<Table.Thead>
				<Table.Tr>
					{keys.map((col, i) => (
						<Table.Th key={`col${i}`}>{col}</Table.Th>
					))}
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{data &&
					data.length > 0 &&
					[...data].map((row, i) => (
						<Table.Tr key={`row${i}`}>
							{keys.map((key, j) => (
								<Table.Td key={`cell${j}`}>{cell(row, key, j)}</Table.Td>
							))}
						</Table.Tr>
					))}
			</Table.Tbody>
		</Table>
	);
}
