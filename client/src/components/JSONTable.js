import { Table, Text, Th } from "@chakra-ui/react";
import { useEffect, useState } from "react";
// import LikeButton from "./LikeButton";

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
			// case "liked":
			// 	return <LikeButton id={row["_id"]} like={row["liked"]} size={18} />;
			// case "track":
			// 	return (
			// 		<Link href={`/track?id=${row["_id"]}`}>
			// 			<Text>{row[key].toString()}</Text>
			// 		</Link>
			// 	);
			default:
				return <Text>{String(row[key])}</Text>;
		}
	};

	return (
		<Table.Root w={"100%"} variant={"outline"} colorPalette={"green"}>
			<Table.Header>
				<Table.Row>
					{columns.map((col, i) => (
						<Table.ColumnHeader key={`col${i}`}>{col}</Table.ColumnHeader>
					))}
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{[...data].map((row, i) => (
					<Table.Row key={`row${i}`}>
						{columns.map((key, j) => (
							<Table.Cell key={`cell${j}`}>{cell(row, key, j)}</Table.Cell>
						))}
					</Table.Row>
				))}
			</Table.Body>
		</Table.Root>
	);
}
