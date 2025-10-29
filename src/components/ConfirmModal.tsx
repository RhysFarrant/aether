/**
 * ConfirmModal - Reusable confirmation dialog
 * Used for destructive actions like deleting characters
 */

interface ConfirmModalProps {
	isOpen: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function ConfirmModal({
	isOpen,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	onConfirm,
	onCancel,
}: ConfirmModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60"
				onClick={onCancel}
			/>

			{/* Modal */}
			<div className="relative bg-background-secondary border-2 border-accent-400/30 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
				{/* Title */}
				<h2 className="text-2xl font-bold text-accent-400 mb-3">
					{title}
				</h2>

				{/* Message */}
				<p className="text-parchment-200 mb-6">{message}</p>

				{/* Buttons */}
				<div className="flex items-center justify-end gap-3">
					<button
						onClick={onCancel}
						className="px-5 py-2 bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-200 font-semibold rounded transition-colors"
					>
						{cancelText}
					</button>
					<button
						onClick={onConfirm}
						className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors"
					>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	);
}
