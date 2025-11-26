import { Container, Group, Stack, Text, Title } from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { tracks } from "../api";
import JSONTable from "../components/JSONTable";
import LikeButton from "../components/LikeButton";
import { UserContext } from "../UserContext";

export default function TrackEvent() {
	const user = useContext(UserContext);
	const [searchParams] = useSearchParams();
	const [trackStreams, setTrackStreams] = useState(null);
	const [liked, setLiked] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			if (!user.id || !searchParams.get("uri")) return;
			try {
				const [streamsRes, likedRes] = await Promise.all([
					tracks.getStreams(searchParams.get("uri")),
					tracks.isLiked(searchParams.get("uri")),
				]);

				setTrackStreams(streamsRes);
				setLiked(likedRes[0]);
			} catch (error) {
				console.error("Failed to fetch track data:", error);
			}
		};

		fetchData();
	}, [searchParams, user.id]);

	return (
		<>
			{trackStreams !== null && (
				<Container size="xl">
					<Stack gap="lg">
						<Group align="baseline">
							<Title>{trackStreams[0]["master_metadata_track_name"]}</Title>
							<Text>
								{trackStreams[0]["master_metadata_album_artist_name"]}
							</Text>
							<LikeButton id={searchParams.get("uri")} like={liked} />
						</Group>
						<JSONTable
							data={trackStreams}
							keys={[
								"ts",
								"platform",
								"ms_played",
								"conn_country",
								"shuffle",
								"skipped",
								"offline",
								"incognito_mode",
							]}
						/>
					</Stack>
				</Container>
			)}
		</>
	);
}
