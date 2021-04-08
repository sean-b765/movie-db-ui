/**
 * Enable or disable scrolling on the body when an overlay div has gone fullscreen
 * Still allows the overlay div to scroll if the overflow-y is set as scroll
 */

export function disableScroll() {
	document.body.style.overflow = 'hidden'
}

export function enableScroll() {
	document.body.style.overflow = 'auto'
}
