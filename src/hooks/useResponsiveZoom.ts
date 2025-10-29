import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive zoom scaling
 * Applies 3-tier zoom based on viewport width:
 * - ≤ 1920px (1080p or less): 70% zoom
 * - > 1920px and < 3840px (2K): 100% zoom
 * - ≥ 3840px (4K or larger): 130% zoom
 */
export function useResponsiveZoom() {
	const [zoom, setZoom] = useState(100);

	useEffect(() => {
		const updateZoom = () => {
			const width = window.innerWidth;
			let newZoom = 100;

			if (width >= 3840) {
				newZoom = 130; // 4K or larger
			} else if (width > 1920) {
				newZoom = 100; // Between 1080p and 4K
			} else {
				newZoom = 70; // 1080p or less
			}

			setZoom(newZoom);
		};

		updateZoom();
		window.addEventListener('resize', updateZoom);
		return () => window.removeEventListener('resize', updateZoom);
	}, []);

	return zoom;
}
