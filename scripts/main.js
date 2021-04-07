import { mobileMenu, mobileMenuOpener } from './header.js'
import { disableScroll, enableScroll } from './handleScroll.js'

const API_KEY = '6a2ae44babf3ff78b6e4d09363704281'
const IMAGE_PATH = 'https://image.tmdb.org/t/p/w1280'

// Used to hide when searching
const filterSection = document.querySelector('section.filters .container')
const sortSection = document.querySelector('section.sort .container')
// Container/text which shows after searching a media
const searchTermText = document.querySelector('section.search-term .text')
const searchTermContainer = document.querySelector('section.search-term')

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

// User's region (not implemented)
const _locale = 'US'

let _loading = false

const loader = document.getElementById('loader')
const setLoading = (val) => {
	_loading = val
	if (val) {
		loader.style.display = 'block'
		loader.classList.add('visible')
	} else {
		loader.style.display = 'none'
		loader.classList.remove('visible')
	}
}

let _classification = ''
let _cast = {}
let _overview = ''

let maxPages = 1

// Options
let optCurrentMedia = mediaTypes.movie
let optPage = 1
let optSortBy = 'popularity.desc'
let optSearchTerm = ''
// Options

let CURRENT_MEDIA = null

/**
 * Reset the necessary options/variables
 *  called after cancelling search
 */
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

/**
 * Set the clickable pages at the end of the document
 */
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

/**
 * When searching, sort/filter should hide as themoviedb doesn't allow search filters
 */
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
 * Get a request URL from parameters and filters
 * @param {boolean} searching indicates if the user is searching for keywords
 * @param {string} searchTerm search terms
 * @param {boolean} get indicates if you are getting full movie details
 * @param {number} getId movie/tv show Id
 * @param {boolean} get_classification indicates if you are getting the classification
 * @param {boolean} get_cast indicates if you are getting the cast
 * @returns {string} Request URL
 */
const constructRequestUrl = (
	searching = false,
	searchTerm = '',
	get = false,
	getId = 0,
	get_classification = false,
	get_cast = false
) => {
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

	if (get && getId > 0) {
		if (get_classification) {
			// Get the classification of the movie (age rating)
			if (optCurrentMedia === mediaTypes.movie) {
				return `https://api.themoviedb.org/3/${optCurrentMedia}/${getId}/release_dates?api_key=${API_KEY}&language=en-US`
			} else if (optCurrentMedia === mediaTypes.tv) {
				return `https://api.themoviedb.org/3/${optCurrentMedia}/${getId}/content_ratings?api_key=${API_KEY}&language=en-US`
			}
		} else {
			// Otherwise get the cast
			if (get_cast) {
				return `https://api.themoviedb.org/3/${optCurrentMedia}/${getId}/credits?api_key=${API_KEY}&language=en-US`
			}
		}
		// Just simply return the movie details
		return `https://api.themoviedb.org/3/${optCurrentMedia}/${getId}?api_key=${API_KEY}&language=en-US`
	}
	// Default is discover
	return `https://api.themoviedb.org/3/discover/${optCurrentMedia}?api_key=${API_KEY}${filters}${sort}&page=${optPage}`
}

/**
 * Gets the media results array and passes this to showMedia()
 * @param {string} url the API url, use constructRequestUrl()
 */
async function getMedia(url) {
	setLoading(true)

	const res = await fetch(url)
	const data = await res.json()

	mobileMenu.classList.remove('open')
	mobileMenuOpener.classList.remove('open')

	maxPages = data.total_pages
	setPages()

	showMedia(data.results)
}

/*
 *
 */
const main = document.getElementById('main')
/**
 * Clear the main and append each movie (those which have a poster)
 * @param {Array<Object>} medias
 */
function showMedia(medias) {
	setLoading(false)
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
		btn.classList.add('popup')
		btn.addEventListener('click', () => {
			CURRENT_MEDIA = media
			showPopup()
		})

		const info = mediaElement.querySelector('.info')
		info.appendChild(btn)

		main.appendChild(mediaElement)
	})
}

/**
 * Get the full details of the movie
 * @param {number} id
 * @returns {Object[]}
 */
async function getCurrentMedia(id) {
	const res = await fetch(constructRequestUrl(false, '', true, id))
	const data = await res.json()

	return data
}

/**
 * Get age classification (US Rating) from a movie
 * @param {number} id
 * @returns {Object[]}
 */
async function getMovieAgeClassification(id) {
	// Skip the searching/searchTerm parameters,
	//  Then we are getting the movie classification (last boolean)
	const res = await fetch(constructRequestUrl(false, '', true, id, true))
	const data = await res.json()

	return data.results
}

async function getMovieCast(id) {
	// Last true-boolean indicates we are fetching the cast
	const res = await fetch(constructRequestUrl(false, '', true, id, false, true))
	const data = await res.json()
	data.then((d) => {
		console.log(d)
	})
}

/*
 *
 */
const popupDiv = document.getElementById('popup')
function showPopup() {
	if (_loading) {
		console.log('waiting for first task to complete')
		return
	}

	// mark loading as true
	setLoading(true)

	// Reset global popup-required variables
	_cast = {}
	_classification = ''
	_overview = ''

	getCurrentMedia(CURRENT_MEDIA.id).then((data) => {
		// Set the overview here
		_overview = data.overview
		getMovieAgeClassification(CURRENT_MEDIA.id).then((d) => {
			// Set the classification (age rating) here
			d.forEach((_release) => {
				if (_release.iso_3166_1 === _locale) {
					if (optCurrentMedia === mediaTypes.movie) {
						_classification = _release.release_dates[0].certification
					} else if (optCurrentMedia === mediaTypes.tv) {
						_classification = _release.rating
					}
				}
			})

			// Add open class to popup div
			popupDiv.classList.add('open')

			const container = popupDiv.getElementsByClassName('container')[0]
			// Insert HTML into the container
			container.innerHTML = `
				<div class="banner exclude-margin">
					<img src="${
						IMAGE_PATH +
						(data.backdrop_path ? data.backdrop_path : data.poster_path)
					}" class="exclude-margin"></img>
				</div>
				<div class="under-banner exclude-margin">
					<div class="top-info exclude-margin">
						<h3 class="title">${data.title ? data.title : data.name}</h3>
						<div class="info-small exclude-margin">
							${
								_classification &&
								`<h4 class="classification exclude-margin">${_classification}</h4>`
							}
							<h4 class="release exclude-margin">${
								data.release_date ? data.release_date : data.first_air_date
							}</h4>
						</div>
					</div>
					<div class="tag exclude-margin"><h5>${
						data.tagline ? `"${data.tagline}"` : ''
					}</h5></div>
					<div class="sub-info">
						<div class="votes">
							<span class="average">
								<i class="fas fa-fire exclude-margin" alt="Average vote icon"></i>
								<span class="${
									data.vote_average > 5
										? data.vote_average > 8
											? 'green'
											: 'yellow'
										: 'red'
								} exclude-margin" alt="Average vote">${data.vote_average}</span>
							</span>
							<span class="total">
								<i class="fas fa-user exclude-margin" alt="Total votes icon"></i>
								<span class="count exclude-margin" alt="Total votes">${data.vote_count}</span>
							</span>
						</div>
					</div>
					<p class="overview">${_overview}</p>
					<div class="mobile-button exclude-margin">
					</div>
				</div>
			`
			// Get buttons section,
			const buttons = container.querySelector('.mobile-button')
			// Append 'view plot', 'view cast' buttons
			const btnPlot = document.createElement('button')
			btnPlot.classList.add('round')
			btnPlot.id = 'btnViewPlot'
			btnPlot.innerHTML = 'View Plot'
			btnPlot.addEventListener('click', () => {
				showPlotMobile()
			})
			buttons.appendChild(btnPlot)

			const btnCast = document.createElement('button')
			btnCast.classList.add('round')
			btnCast.id = 'btnViewCast'
			btnCast.innerHTML = 'View Cast'
			btnCast.addEventListener('click', () => {
				showCastMobile(CURRENT_MEDIA.id)
			})
			buttons.appendChild(btnCast)

			// Mark loading as false again
			setLoading(false)
		})
	})
}

const infoArea = document.getElementById('infoArea')
const infoCloseButton = document.getElementById('info-close-icon')

infoCloseButton.addEventListener('click', () => {
	infoArea.classList.remove('open')
})

const infoAreaContainer = infoArea.querySelector('.container')
const showCastMobile = (id) => {
	infoArea.classList.add('open')
	console.log(_cast)
	infoAreaContainer.innerHTML = `${_cast}`
}
const showPlotMobile = () => {
	infoArea.classList.add('open')
	infoAreaContainer.innerHTML = `${_overview}`
}

/*
 *
 */
const popupClose = document.getElementById('popup-close-icon')
popupClose.addEventListener('click', () => {
	popupDiv.classList.remove('open')
})

/*
 * Search forms
 */
const mobileSearch = document.getElementById('search-mobile')
const mobileForm = document.getElementById('mob-search')
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
const search = document.getElementById('search-desktop')
const form = document.getElementById('form')
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
const mediaSelectMovie = document.querySelectorAll('.media-select.movies')
const mediaSelectTv = document.querySelectorAll('.media-select.tv')
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

/*
 * Get media on filter form submit
 */
const filters = document.getElementById('filters')
// Apply filter button should set filter variables
filters.addEventListener('submit', (e) => {
	e.preventDefault()

	optPage = 1

	getMedia(constructRequestUrl())
})

/*
 * Sort By / Filter sections
 */
const comboBox = document.getElementById('sortingSelect')
comboBox.addEventListener('change', (e) => {
	optSortBy = e.target.value + '.' + order.value

	optPage = 1

	getMedia(constructRequestUrl())
})
const order = document.getElementById('sortingOrder')
order.addEventListener('change', (e) => {
	optSortBy = comboBox.value + '.' + e.target.value

	optPage = 1

	getMedia(constructRequestUrl())
})

/*
 * The box which shows what you searched for,
 * Clicking it will make stop the search
 */
const searchTermBox = document.querySelector('section.search-term .search')
searchTermBox.addEventListener('click', () => {
	optSearchTerm = ''
	reset()
})

/**
 *
 */
const filtersToOpen = document.querySelector('section.filters')
const filtersTextToOpen = document.querySelector('section.filters .text')
// Drop down sort/filters
filtersTextToOpen.addEventListener('click', () => {
	if (filtersToOpen.classList.contains('open')) {
		filtersToOpen.classList.remove('open')
	} else {
		filtersToOpen.classList.add('open')
	}
})

/**
 *
 */
const sortToOpen = document.querySelector('section.sort')
const sortTextToOpen = document.querySelector('section.sort .text')
sortTextToOpen.addEventListener('click', () => {
	if (sortToOpen.classList.contains('open')) {
		sortToOpen.classList.remove('open')
	} else {
		sortToOpen.classList.add('open')
	}
})

// Get media on page load
getMedia(constructRequestUrl())
