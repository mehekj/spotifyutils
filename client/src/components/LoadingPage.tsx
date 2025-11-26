import { Center, Container, Loader } from "@mantine/core";

export default function LoadingPage() {
	return (
		<Container size="xl" mt="xl">
			<Center>
				<Loader />
			</Center>
		</Container>
	);
}
