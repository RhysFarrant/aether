import { useEffect } from "react";

interface ConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	showSelectOption?: boolean;
	onSelectAndContinue?: () => void;
	selectOptionText?: string;
}

/**
 * Reusable confirmation modal for character creation flow
 */
export default function ConfirmationModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = "Continue Anyway",
	cancelText = "Cancel",
	showSelectOption = false,
	onSelectAndContinue,
	selectOptionText = "Select and Continue",
}: ConfirmationModalProps) {
	// Close modal on Escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative bg-background-secondary border-2 border-accent-400/40 rounded-lg shadow-2xl max-w-md w-full mx-4 animate-slideInFromBottom">
				{/* Header */}
				<div className="bg-accent-400/10 border-b border-accent-400/20 px-6 py-4">
					<h3 className="text-xl font-bold text-accent-400 uppercase">
						{title}
					</h3>
				</div>

				{/* Content */}
				<div className="px-6 py-6">
					<p className="text-parchment-200 leading-relaxed">{message}</p>
				</div>

				{/* Actions */}
				<div className="bg-background-tertiary/30 border-t border-accent-400/20 px-6 py-4 flex gap-3 justify-end">
					<button
						onClick={onClose}
						className="px-4 py-2 bg-background-secondary border border-accent-400/20 hover:border-accent-400/40 text-parchment-200 hover:text-parchment-100 font-semibold rounded transition-colors"
					>
						{cancelText}
					</button>
					{showSelectOption && onSelectAndContinue && (
						<button
							onClick={onSelectAndContinue}
							className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-background-primary font-semibold rounded transition-colors"
						>
							{selectOptionText}
						</button>
					)}
					<button
						onClick={onConfirm}
						className="px-4 py-2 bg-accent-400 hover:bg-accent-500 text-background-primary font-semibold rounded transition-colors"
					>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	);
}
