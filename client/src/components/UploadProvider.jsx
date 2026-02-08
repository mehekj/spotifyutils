import { useState } from "react";
import { UploadContext } from "../UploadContext";
import UploadStatusDialog from "./UploadStatusDialog";

export default function UploadProvider({ children }) {
	const [progress, setProgress] = useState(-1);
	const [currFile, setCurrFile] = useState(null);
	const [completedTime, setCompletedTime] = useState(-1);

	const inProgress = () => {
		return progress >= 0 && progress < 100;
	};

	const closeUploadStatus = () => {
		setProgress(-1);
		setCompletedTime(-1);
	};

	return (
		<UploadContext.Provider
			value={{
				inProgress,
				setProgress,
				setCurrFile,
				setCompletedTime,
			}}
		>
			<UploadStatusDialog
				progress={progress}
				currFile={currFile}
				completedTime={completedTime}
				onClose={closeUploadStatus}
			/>
			{children}
		</UploadContext.Provider>
	);
}
