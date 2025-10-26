import {
    Link,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import LikeButton from "./LikeButton";

export default function JSONTable({ data, keys = null }) {
	const [columns, setColumns] = useState([]);

	useEffect(() => {
		if (data && keys) {
			setColumns(Object.keys(data[0]).filter((col) => keys.includes(col)));
		} else if (data) {
			setColumns(Object.keys(data[0]));
		}
	}, [data, keys]);

	const cell = (row, key) => {
		switch (key) {
			case "liked":
				return <LikeButton id={row["_id"]} like={row["liked"]} size={18} />;
			case "track":
				return (
					<Link href={`/track?id=${row["_id"]}`}>
						<Text>{row[key].toString()}</Text>
					</Link>
				);
			default:
				return <Text>{String(row[key])}</Text>;
		}
	};

	return (
		<TableContainer w={"100%"}>
			<Table
				variant={"striped"}
				colorScheme={"whiteAlpha"}
				size={{ base: "sm", md: "md" }}
			>
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
