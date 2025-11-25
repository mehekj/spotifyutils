import { Anchor, Table, Text } from "@mantine/core";
import { useMemo } from "react";
import LikeButton from "./LikeButton";

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
				return <LikeButton id={row["_id"]} like={row["liked"]} />;
			case "track":
				return (
					<Anchor to={`/track?uri=${row["_id"]}`}>{row[key].toString()}</Anchor>
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
