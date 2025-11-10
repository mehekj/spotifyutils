import { HStack, Heading, Text, VStack } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UserContext } from "../App";
import JSONTable from "../components/JSONTable";
import LikeButton from "../components/LikeButton";
import { getLiked, getTrackStreams } from "../spotify_client";

export default function TrackEvent() {
	const { user } = useContext(UserContext);
	const [searchParams] = useSearchParams();
	const [trackStreams, setTrackStreams] = useState(null);
	const [liked, setLiked] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			if (!user.id || !searchParams.get("uri")) return;
			try {
				const [streamsRes, likedRes] = await Promise.all([
					getTrackStreams(searchParams.get("uri")),
					getLiked(searchParams.get("uri")),
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
				<VStack align={"flex-start"} spacing={5}>
					<HStack align={"baseline"} spacing={6}>
						<Heading size={"2xl"} mb={3}>
							{trackStreams[0]["master_metadata_track_name"]}
						</Heading>
						<Text>{trackStreams[0]["master_metadata_album_artist_name"]}</Text>
						<LikeButton id={searchParams.get("uri")} like={liked} size={24} />
					</HStack>
					<JSONTable
						data={trackStreams}
						keys={[
							"ts",
							"platform",
							"ms_played",
							"conn_country",
							"reason_start",
							"reason_end",
							"shuffle",
							"skipped",
							"offline",
							"incognito_mode",
						]}
					/>
				</VStack>
			)}
		</>
	);
}
