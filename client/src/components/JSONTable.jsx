import { Table, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LikeButton from "./LikeButton";

export default function JSONTable({ data, keys = null }) {
	const [columns, setColumns] = useState([]);

	useEffect(() => {
		if (keys && data && data.length > 0) {
			setColumns(Object.keys(data[0]).filter((col) => keys.includes(col)));
		} else if (data && data.length > 0) {
			setColumns(Object.keys(data[0]));
		}
	}, [data, keys]);

	const cell = (row, key) => {
		switch (key) {
			case "liked":
				return <LikeButton id={row["_id"]} like={row["liked"]} />;
			case "track":
				return (
					<Link to={`/track?uri=${row["_id"]}`}>
						<Text>{row[key].toString()}</Text>
					</Link>
				);
			default:
				return <Text>{String(row[key])}</Text>;
		}
	};

	return (
		<Table>
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

//TODO: change track urls to include uri instead of using query
