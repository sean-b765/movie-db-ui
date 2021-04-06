import { mobileMenu, mobileMenuOpener } from './header.js'
import { disableScroll, enableScroll } from './handleScroll.js'

const API_KEY = '6a2ae44babf3ff78b6e4d09363704281'
const IMAGE_PATH = 'https://image.tmdb.org/t/p/w1280'

const form = document.getElementById('form')
const search = document.getElementById('search-desktop')
const mobileForm = document.getElementById('mob-search')
const mobileSearch = document.getElementById('search-mobile')

const filters = document.getElementById('filters')
const filtersToOpen = document.querySelector('section.filters')
const filtersTextToOpen = document.querySelector('section.filters .text')
const filterSection = document.querySelector('section.filters .container')

const sortSection = document.querySelector('section.sort .container')
const sortToOpen = document.querySelector('section.sort')
const sortTextToOpen = document.querySelector('section.sort .text')

const searchTermText = document.querySelector('section.search-term .text')
const searchTermBox = document.querySelector('section.search-term .search')
const searchTermContainer = document.querySelector('section.search-term')

const main = document.getElementById('main')

const mediaSelectMovie = document.querySelectorAll('.media-select.movies')
const mediaSelectTv = document.querySelectorAll('.media-select.tv')

/* Filters */
const release = document.getElementById('release')
const checkboxRelease = document.getElementById('doYearFilter')
const minRating = document.getElementById('minRating')
const maxRating = document.getElementById('maxRating')
const checkboxRating = document.getElementById('doRatingFilter')
const checkboxAdult = document.getElementById('doIncludeAdult')

const mediaTypes = {
	movie: 'movie',
	tv: 'tv',
	multi: 'multi',
}

let maxPages = 1
// Default options
let optCurrentMedia = mediaTypes.movie
let optPage = 1
let optSortBy = 'popularity.desc'
let optSearchTerm = ''
let optFilters = {
	rating: {
		min: 0,
		max: 10,
	},
	releaseDate: 0,
}
//

let CURRENT_MEDIA = null

// Reset, called after deleting search term
const reset = () => {
	optSearchTerm = ''
	optPage = 1

	mediaSelectTv.forEach((tv) => {
		if (tv.classList.contains('active')) {
			optCurrentMedia = mediaTypes.tv
		}
	})
	mediaSelectMovie.forEach((movie) => {
		if (movie.classList.contains('active')) {
			optCurrentMedia = mediaTypes.movie
		}
	})

	hideSortFilter(false)
}

// Set the clickable pages at the end of the page
const pages = document.getElementById('pages')
const setPages = () => {
	pages.innerHTML = ''
	const elem = document.createElement('div')
	elem.classList.add('page-selection')

	const values = []
	for (let i = optPage - 2; i < optPage + 3; i++) {
		if (i >= 1 && i <= maxPages) {
			values.push(i)
		}
	}
	values.forEach((val) => {
		if (val === optPage) {
			elem.innerHTML += `<button class="page active-page">${val}</button>`
			return true
		}
		elem.innerHTML += `<button class="page">${val}</button>`
	})

	pages.appendChild(elem)

	const pageElements = document.querySelectorAll('.page')

	pageElements.forEach((page) => {
		page.addEventListener('click', (e) => {
			const clickedPage = parseInt(e.target.innerHTML)
			optPage = clickedPage
			window.scrollTo(0, 0)
			getMedia(constructRequestUrl(), false)
		})
	})
}

// When searching, sort/filter should hide as themoviedb doesn't allow search filters
const hideSortFilter = (hide = true) => {
	if (hide) {
		filterSection.style.display = 'none'
		sortSection.style.display = 'none'
		filtersTextToOpen.style.display = 'none'
		sortTextToOpen.style.display = 'none'
		searchTermText.innerHTML = optSearchTerm
		searchTermContainer.style.display = 'flex'
	} else {
		filterSection.style.display = ''
		sortSection.style.display = ''
		filtersTextToOpen.style.display = ''
		sortTextToOpen.style.display = ''
		searchTermText.innerHTML = ''
		searchTermContainer.style.display = 'none'
		getMedia(constructRequestUrl())
	}
}

/**
 * Get a request URL with parameters
 * @param {boolean} searching true: searching, false: discovering
 * @param {string} searchTerm the term/s to search for
 * @returns {string} API URL
 */
const constructRequestUrl = (searching = false, searchTerm = '') => {
	// set the filters based on the toggles
	let filters = `${
		checkboxRelease.checked ? `&primary_release_year=${release.value}` : ''
	}${
		checkboxRating.checked
			? `&vote_average.gte=${minRating.value}&vote_average.lte=${maxRating.value}`
			: ''
	}${checkboxAdult.checked ? `&include_adult=true` : `&include_adult=false`}`

	// set the sorting
	let sort = `&sort_by=${optSortBy}`

	// If searching was specified, set the searchTerm option and reset the page
	//  Searching is true after submitting a search query in the search bar
	if (searching) {
		optSearchTerm = searchTerm
		optPage = 1
	}
	// If set retain the searchTerm as it's probably had filters applied, or a page was clicked
	if (optSearchTerm !== '') {
		filters = ''
		sort = ''
		optCurrentMedia = mediaTypes.multi
		hideSortFilter()
		searchTerm = optSearchTerm.replaceAll(' ', '%20')
		return `https://api.themoviedb.org/3/search/${optCurrentMedia}?api_key=${API_KEY}${filters}${sort}&page=${optPage}&query=${searchTerm}`
	}

	// not searching

	// Default is discover
	return `https://api.themoviedb.org/3/discover/${optCurrentMedia}?api_key=${API_KEY}${filters}${sort}&page=${optPage}`
}
// Get movies/tv
async function getMedia(url) {
	console.log(url)
	const res = await fetch(url)
	const data = await res.json()

	mobileMenu.classList.remove('open')
	mobileMenuOpener.classList.remove('open')

	maxPages = data.total_pages
	setPages()

	showMedia(data.results)
}
// Clear the main and append each movie (those which have a poster)
function showMedia(medias) {
	main.innerHTML = ''

	medias.forEach((media) => {
		const { name, title, poster_path, vote_average } = media

		const mediaElement = document.createElement('div')
		mediaElement.classList.add('media')

		// If poster_path is null
		// continue
		if (!poster_path) {
			return true
		}

		mediaElement.innerHTML = `
      <img src="${IMAGE_PATH + poster_path}" alt="${title}">
      <div class="info">
        <h3>${!title ? name : title}</h3>
      </div>
			<span class="${
				vote_average > 5 ? (vote_average > 8 ? 'green' : 'yellow') : 'red'
			}">${vote_average}</span>			
    `

		const btn = document.createElement('button')
		btn.classList.add('circle')
		btn.addEventListener('click', () => {
			CURRENT_MEDIA = media
			console.log(CURRENT_MEDIA)
			showPopup()
		})

		const info = mediaElement.querySelector('.info')
		info.appendChild(btn)

		main.appendChild(mediaElement)
	})
}

const popupDiv = document.getElementById('popup')
function showPopup() {
	disableScroll()
	popupDiv.classList.add('open')
	const container = popupDiv.getElementsByClassName('container')[0]
	container.innerHTML = `
		<div class="banner">
			<img src="${
				IMAGE_PATH +
				(CURRENT_MEDIA.backdrop_path
					? CURRENT_MEDIA.backdrop_path
					: CURRENT_MEDIA.poster_path)
			}"></img>
		</div>
		<h3 class="title">${
			CURRENT_MEDIA.title ? CURRENT_MEDIA.title : CURRENT_MEDIA.name
		}</h3>
		<p class="overview">${CURRENT_MEDIA.overview}</p>
		<div class="votes">
			<span class="average">
				<i class="fas fa-fire"></i>
				<span class="${
					CURRENT_MEDIA.vote_average > 5
						? CURRENT_MEDIA.vote_average > 8
							? 'green'
							: 'yellow'
						: 'red'
				}">${CURRENT_MEDIA.vote_average}</span>
			</span>
			<span class="total">
				<i class="fas fa-user"></i>
				<span class="count">${CURRENT_MEDIA.vote_count}</span>
			</span>
		</div>
	`
}

const popupClose = document.getElementById('popup-close-icon')
popupClose.addEventListener('click', () => {
	enableScroll()
	popupDiv.classList.remove('open')
})

// Mobile/desktop search bar
mobileForm.addEventListener('submit', (e) => {
	e.preventDefault()

	let searchTerm = mobileSearch.value

	if (mobileSearch && searchTerm !== '') {
		mobileMenu.classList.remove('open')

		window.scrollTo(0, 0)
		getMedia(constructRequestUrl(true, searchTerm))
		mobileSearch.value = ''
	} else {
		console.log('Error searching')
	}
})
form.addEventListener('submit', (e) => {
	e.preventDefault()

	let searchTerm = search.value

	if (search && searchTerm !== '') {
		window.scrollTo(0, 0)
		getMedia(constructRequestUrl(true, searchTerm))
		search.value = ''
	} else {
		console.log('Error searching')
	}
})

/*
  Handle navbar selection
	When clicking movies remove active class from Tv
	...vice versa
	Then perform request/refresh main container
 */
mediaSelectMovie.forEach((item) => {
	// Add click event to the mobile/desktop navbar 'movie' options
	item.addEventListener('click', () => {
		reset()
		optCurrentMedia = mediaTypes.movie
		// make the navbar option active
		mediaSelectMovie.forEach((movie) => {
			movie.classList.add('active')
		})

		// Remove active class from tv (mobile/desktop navbar)
		mediaSelectTv.forEach((tv) => {
			tv.classList.remove('active')
		})

		// scroll to top of window
		window.scrollTo(0, 0)
		// Refresh media
		if (search && search.value !== '') {
			getMedia(constructRequestUrl(true, search.value))
			search.value = ''
		} else if (mobileSearch && mobileSearch.value !== '') {
			getMedia(constructRequestUrl(true, mobileSearch.value))
			mobileSearch.value = ''
		} else {
			getMedia(constructRequestUrl())
		}
	})
})
mediaSelectTv.forEach((item) => {
	// Add click event to both desktop/mobile navbar tv options
	item.addEventListener('click', () => {
		reset()
		optCurrentMedia = mediaTypes.tv
		// Add active class
		mediaSelectTv.forEach((tv) => {
			tv.classList.add('active')
		})

		// Remove active class from movie (mobile/desktop navbar)
		mediaSelectMovie.forEach((movie) => {
			movie.classList.remove('active')
		})

		window.scrollTo(0, 0)
		if (search && search.value !== '') {
			getMedia(constructRequestUrl(true, search.value))
			search.value = ''
		} else if (mobileSearch && mobileSearch.value !== '') {
			getMedia(constructRequestUrl(true, mobileSearch.value))
			mobileSearch.value = ''
		} else {
			getMedia(constructRequestUrl())
		}
	})
})

// Apply filter button should set filter variables
filters.addEventListener('submit', (e) => {
	e.preventDefault()

	optFilters.rating.min = minRating.value
	optFilters.rating.max = maxRating.value
	optPage = 1

	getMedia(constructRequestUrl())
})

const order = document.getElementById('sortingOrder')
const comboBox = document.getElementById('sortingSelect')
comboBox.addEventListener('change', (e) => {
	optSortBy = e.target.value + '.' + order.value

	optPage = 1

	getMedia(constructRequestUrl())
})
order.addEventListener('change', (e) => {
	optSortBy = comboBox.value + '.' + e.target.value

	optPage = 1

	getMedia(constructRequestUrl())
})

// The box which shows what you searched for,
//  Clicking it will make stop the search
searchTermBox.addEventListener('click', () => {
	optSearchTerm = ''
	reset()
})

// Drop down sort/filters
filtersTextToOpen.addEventListener('click', () => {
	if (filtersToOpen.classList.contains('open')) {
		filtersToOpen.classList.remove('open')
	} else {
		filtersToOpen.classList.add('open')
	}
})
sortTextToOpen.addEventListener('click', () => {
	if (sortToOpen.classList.contains('open')) {
		sortToOpen.classList.remove('open')
	} else {
		sortToOpen.classList.add('open')
	}
})

// Get media on page load
getMedia(constructRequestUrl())
