import { Table, Text } from "@mantine/core";
import { useMemo } from "react";
import LikeButton from "./LikeButton";
import ArtistLink from "./ArtistLink";
import TrackLink from "./TrackLink";
import AlbumLink from "./AlbumLink";

export default function JSONTable({ data, keys = null }) {
	const columns = useMemo(() => {
		if (!data || data.length === 0) return [];
		return keys
			? Object.keys(data[0]).filter((col) => keys.includes(col))
			: Object.keys(data[0]);
	}, [data, keys]);

	const cell = (row, key) => {
		switch (key) {
			case "liked":
				return (
					<LikeButton uri={row["spotify_track_uri"]} like={row["liked"]} />
				);
			case "master_metadata_track_name":
				return (
					<TrackLink uri={row["spotify_track_uri"]}>
						{row[key].toString()}
					</TrackLink>
				);
			case "master_metadata_album_artist_name":
				return (
					<ArtistLink name={row[key].toString()}>
						{row[key].toString()}
					</ArtistLink>
				);
			case "master_metadata_album_album_name":
				return (
					<AlbumLink name={row[key].toString()}>
						{row[key].toString()}
					</AlbumLink>
				);
			default:
				return <Text>{String(row[key])}</Text>;
		}
	};

	return (
		<Table tabularNums>
			<Table.Thead>
				<Table.Tr>
					{columns.map((col, i) => (
						<Table.Th key={`col${i}`}>{col}</Table.Th>
					))}
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{data &&
					data.length > 0 &&
					[...data].map((row, i) => (
						<Table.Tr key={`row${i}`}>
							{columns.map((key, j) => (
								<Table.Td key={`cell${j}`}>{cell(row, key, j)}</Table.Td>
							))}
						</Table.Tr>
					))}
			</Table.Tbody>
		</Table>
	);
}
