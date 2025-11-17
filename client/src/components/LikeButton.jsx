import { Box } from "@mantine/core";
import { useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { tracks } from "../api";

export default function LikeButton({ id, like, size }) {
	const [liked, setLiked] = useState(like);

	return (
		<Box
			onPointerDown={async (e) => {
				e.stopPropagation();
				await tracks.toggleLike(id, liked);
				setLiked(!liked);
			}}
			cursor={"pointer"}
		>
			{liked ? <FaHeart size={size} /> : <FaRegHeart size={size} />}
		</Box>
	);
}
