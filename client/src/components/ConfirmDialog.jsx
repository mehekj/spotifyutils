import { useState } from "react";
import { Modal, Button, Text, Group } from "@mantine/core";

export default function useConfirm() {
	const [opened, setOpened] = useState(false);
	const [message, setMessage] = useState("");
	const [resolver, setResolver] = useState(null);

	const confirm = (msg) => {
		setMessage(msg);
		setOpened(true);

		return new Promise((resolve) => {
			setResolver(() => resolve);
		});
	};

	const handleConfirm = () => {
		resolver(true);
		setOpened(false);
	};

	const handleCancel = () => {
		resolver(false);
		setOpened(false);
	};

	const ConfirmModal = (
		<Modal
			opened={opened}
			onClose={handleCancel}
			centered
			title="WARNING"
			bg="dark.3"
		>
			<Text>{message}</Text>
			<Group>
				<Button mt="md" onClick={handleConfirm}>
					Confirm
				</Button>
				<Button mt="md" variant="outline" onClick={handleCancel}>
					Cancel
				</Button>
			</Group>
		</Modal>
	);

	return { confirm, ConfirmModal };
}
