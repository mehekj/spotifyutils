import {
	Container,
	Group,
	Image,
	Loader,
	Skeleton,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { tracks } from "../api";
import JSONTable from "../components/JSONTable";
import LikeButton from "../components/LikeButton";
import { UserContext } from "../UserContext";
import LoadingPage from "../components/LoadingPage";

export default function TrackEvent() {
	const { user } = useContext(UserContext);
	const [searchParams] = useSearchParams();
	const [trackStreams, setTrackStreams] = useState(null);
	const [liked, setLiked] = useState(false);
	const [trackInfo, setTrackInfo] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			const uri = searchParams.get("uri");
			if (!user.id || !uri) return;

			try {
				setLoading(true);
				const [streamsRes, likedRes, infoRes] = await Promise.all([
					tracks.getStreams(uri),
					tracks.isLiked(uri),
					tracks.getTrackInfo(uri),
				]);

				setTrackStreams(streamsRes);
				setLiked(likedRes[0]);
				setTrackInfo(infoRes);
				setLoading(false);
			} catch (error) {
				console.error("Failed to fetch track data:", error);
			}
		};

		fetchData();
	}, [searchParams, user.id]);

	if (loading) return <LoadingPage />;

	return (
		<Container size="xl">
			<Stack gap="xl">
				{trackInfo !== null && (
					<Group align="end" my="xl" grow preventGrowOverflow={false}>
						<Image
							src={trackInfo.album.images[1].url}
							maw={trackInfo.album.images[1].width}
						/>
						<Stack>
							<Group>
								<Title mr="lg" size={48}>
									{trackInfo.name}
								</Title>
								<LikeButton
									id={searchParams.get("uri")}
									like={liked}
									size={64}
								/>
							</Group>
							<Group align="baseline">
								<Text fz={20} ta="center">
									{trackInfo.artists.map((artist) => artist.name).join(", ")}
								</Text>
							</Group>
						</Stack>
					</Group>
				)}
				{trackStreams !== null && (
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
				)}
			</Stack>
		</Container>
	);
}
