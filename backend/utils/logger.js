const formatScope = (scope) => `[${scope}]`;

export const logDebug = (scope, message, details = {}) => {
	const payload =
		details && Object.keys(details).length > 0 ? { message, details } : message;
	console.debug(formatScope(scope), payload);
};

export const logError = (scope, message, error, details = {}) => {
	const payload = {
		message,
		...(details && Object.keys(details).length > 0 ? details : {}),
		...(error ? { error } : {}),
	};

	console.error(formatScope(scope), payload);
};
