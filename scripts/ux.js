export const mobileSearch = document.querySelector('#mob-search .search')

export const mobileMenuOpener = document.querySelector('.mobile-menu-opener')
export const mobileMenu = document.querySelector('.mob-menu-wrapper')

const nav = document.querySelector('header.nav')

/**
 * Handle the menu open/close functionality
 */
mobileMenuOpener.addEventListener('click', () => {
	updateMobileMenu()
})
function updateMobileMenu() {
	if (mobileMenu.classList.contains('open')) {
		mobileMenu.classList.remove('open')
		mobileMenuOpener.classList.remove('open')
	} else {
		mobileMenu.classList.add('open')
		mobileMenuOpener.classList.add('open')
	}
}

/**
 * Handle the scroll event -> add styles to navbar
 */
let lastYPos = 0
const handleScroll = () => {
	if (window.pageYOffset > lastYPos) {
		// user scrolled down
		nav.classList.add('scrolled')
	} else {
		// user scrolled up
		nav.classList.remove('scrolled')
	}

	lastYPos = window.pageYOffset
}

window.addEventListener('scroll', handleScroll)
