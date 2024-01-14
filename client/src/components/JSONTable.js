import {
	Box,
	Table,
	TableContainer,
	Tbody,
	Td,
	Th,
	Thead,
	Tr,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { toggleLike } from "../spotify";

export default function JSONTable({ data, keys }) {
	const [columns, setColumns] = useState([]);
	const [likes, setLikes] = useState([]);

	useEffect(() => {
		if (data && keys) {
			setColumns(Object.keys(data[0]).filter((col) => keys.includes(col)));

			if (keys.includes("liked")) {
				setLikes([...data].map((row) => row.liked));
			}
		}
	}, [data, keys]);

	const likeButton = (track) => {
		return (
			<Box
				onPointerDown={async (e) => {
					e.stopPropagation();
					await toggleLike(track._id, track.liked);
					track.liked = !track.liked;
					setLikes([...data].map((row) => row.liked));
				}}
				cursor={"pointer"}
			>
				{track.liked ? <FaHeart /> : <FaRegHeart />}
			</Box>
		);
	};

	const cell = (row, key) => {
		switch (key) {
			case "liked":
				return likeButton(row);
			default:
				return row[key].toString();
		}
	};

	return (
		<TableContainer w={"100%"}>
			<Table variant={"striped"} colorScheme={"whiteAlpha"}>
				<Thead>
					<Tr>
						{columns.map((col, i) => (
							<Th key={`col${i}`}>{col}</Th>
						))}
					</Tr>
				</Thead>
				<Tbody>
					{[...data].map((row, i) => (
						<Tr key={`row${i}`}>
							{columns.map((key, j) => (
								<Td key={`cell${j}`}>{cell(row, key, j)}</Td>
							))}
						</Tr>
					))}
				</Tbody>
			</Table>
		</TableContainer>
	);
}
