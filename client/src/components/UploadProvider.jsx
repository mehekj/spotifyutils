import { useState } from "react";
import { UploadContext } from "../UploadContext";

export default function UploadProvider({ children }) {
	const [progress, setProgress] = useState(-1);
	const [currFile, setCurrFile] = useState(null);
	const [completedTime, setCompletedTime] = useState(-1);

	return (
		<UploadContext.Provider
			value={{
				progress,
				setProgress,
				currFile,
				setCurrFile,
				completedTime,
				setCompletedTime,
			}}
		>
			{children}
		</UploadContext.Provider>
	);
}
