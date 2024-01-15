import { HStack, Heading, Text, VStack } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UserContext } from "../App";
import JSONTable from "../components/JSONTable";
import LikeButton from "../components/LikeButton";
import { getLiked, getTrackListens } from "../spotify";

export default function TrackEvent() {
	const { user } = useContext(UserContext);
	const [searchParams] = useSearchParams();
	const [trackListens, setTrackListens] = useState(null);
	const [liked, setLiked] = useState(false);

	useEffect(() => {
		const fetchTrackListens = async () => {
			if (user.id) {
				const res = await getTrackListens(user.id, searchParams.get("id"));
				setTrackListens(res.data);
			}
		};

		fetchTrackListens().catch((err) => console.error(err));

		const fetchLiked = async () => {
			const res = await getLiked(searchParams.get("id"));
			setLiked(res[0]);
		};

		fetchLiked();
	}, [searchParams, user.id]);

	return (
		<>
			{trackListens !== null && (
				<VStack align={"flex-start"} spacing={5}>
					<HStack align={"baseline"} spacing={6}>
						<Heading size={"2xl"} mb={3}>
							{trackListens[0]["master_metadata_track_name"]}
						</Heading>
						<Text>{trackListens[0]["master_metadata_album_artist_name"]}</Text>
						<LikeButton id={searchParams.get("id")} like={liked} size={24} />
					</HStack>
					<JSONTable
						data={trackListens}
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
