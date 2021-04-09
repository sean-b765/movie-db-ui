import { mobileMenu, mobileMenuOpener } from './header.js'
import { enableScroll, disableScroll } from './handleScroll.js'

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

// Debug mode
const debug = true
const log = (value) => {
	if (!debug) return
	console.log(value)
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

	// Get the pages +2 and -2 from the current page
	const values = []
	for (let i = optPage - 2; i < optPage + 3; i++) {
		if (i >= 1 && i <= maxPages) {
			values.push(i)
		}
	}
	// Make the 'jump to first page' button
	if (optPage > 3) {
		elem.innerHTML += `<button class="skip skip-start"><<</button>`
	}
	// Render the buttons to the page-selection div and apply active-page class to current
	values.forEach((val) => {
		if (val === optPage) {
			elem.innerHTML += `<button class="page active-page">${val}</button>`
			return true
		}
		elem.innerHTML += `<button class="page">${val}</button>`
	})
	// Make the 'jump to end' button
	if (optPage <= maxPages - 3) {
		elem.innerHTML += `<button class="skip skip-end">>></button>`
	}

	pages.appendChild(elem)

	// Set the page to 1 for skip to start button click event
	try {
		const skipStart = document.getElementsByClassName('skip-start')[0]
		log(skipStart)
		skipStart.addEventListener('click', () => {
			optPage = 1
			window.scrollTo(0, 0)
			getMedia(constructRequestUrl(), false)
		})
		// Catch in case we are at first, second, third pages
	} catch (Error) {}

	// Set the page to maxPage for skip to start button click event
	try {
		const skipEnd = document.getElementsByClassName('skip-end')[0]
		skipEnd.addEventListener('click', () => {
			optPage = maxPages
			window.scrollTo(0, 0)
			getMedia(constructRequestUrl(), false)
		})
		// Catch in case we at maxPage
	} catch (Error) {}

	const pageElements = document.querySelectorAll('.page')
	// Add the events to the page buttons to set the optPage variable, then fetch again
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
 * @param {string} type the media type. required to distinguish search results
 * @returns {string} Request URL
 */
const constructRequestUrl = (
	searching = false,
	searchTerm = '',
	get = false,
	getId = 0,
	get_classification = false,
	get_cast = false,
	type = ''
) => {
	// set the filters based on the toggles
	let filters = `${
		checkboxRelease.checked
			? optCurrentMedia === mediaTypes.tv
				? `&first_air_date_year=${release.value}`
				: `&primary_release_year=${release.value}`
			: ''
	}${
		checkboxRating.checked
			? `&vote_average.gte=${minRating.value}&vote_average.lte=${maxRating.value}`
			: ''
	}${checkboxAdult.checked ? `&include_adult=true` : `&include_adult=false`}`

	// set the sorting
	let sort = `&sort_by=${optSortBy}`

	// If searching was specified, retain the searchTerm option and reset the page
	//  Searching is true after submitting a search query in the search bar
	if (searching) {
		optSearchTerm = searchTerm
		optPage = 1
	}

	// If still viewing a search
	if (optSearchTerm !== '') {
		filters = ''
		sort = ''
		hideSortFilter()
		// Make the search term URL friendly (spaces will be replaced with %20)
		searchTerm = optSearchTerm.replaceAll(' ', '%20')

		// If the type is specified, user clicked on a search result
		if (type !== '') {
			if (get_classification) {
				// Get the classification of the result (age rating)
				log('Retrieving search result age rating')
				// Movies age rating can be retrieved using /movieId/release_dates?
				let tvOrMovie = 'release_dates'
				// TV age rating can be retrieved using /tvId/content_ratings?
				if (type === 'tv') tvOrMovie = 'content_ratings'

				return `https://api.themoviedb.org/3/${type}/${getId}/${tvOrMovie}?api_key=${API_KEY}&language=en-US`
			}
			// Otherwise get the cast
			if (get_cast) {
				log('Retrieving search result cast')
				return `https://api.themoviedb.org/3/${type}/${getId}/credits?api_key=${API_KEY}&language=en-US`
			}

			log('Retrieving search result popup data')
			return `https://api.themoviedb.org/3/${type}/${getId}?api_key=${API_KEY}&language=en-US`
		} else {
			// otherwise just fetch all search results
			log('Retrieving search results')
			return `https://api.themoviedb.org/3/search/${mediaTypes.multi}?api_key=${API_KEY}${filters}${sort}&page=${optPage}&query=${searchTerm}`
		}
	}

	// not searching or retrieving search result data

	if (get && getId > 0) {
		if (get_classification) {
			// Get the classification of the movie (age rating)
			if (optCurrentMedia === mediaTypes.movie) {
				log('Retrieving Movie classification')
				return `https://api.themoviedb.org/3/${optCurrentMedia}/${getId}/release_dates?api_key=${API_KEY}&language=en-US`
			} else if (optCurrentMedia === mediaTypes.tv) {
				log('Retrieving TV classification')
				return `https://api.themoviedb.org/3/${optCurrentMedia}/${getId}/content_ratings?api_key=${API_KEY}&language=en-US`
			}
		}
		// Otherwise get the cast
		if (get_cast) {
			log('Retrieving cast')
			return `https://api.themoviedb.org/3/${optCurrentMedia}/${getId}/credits?api_key=${API_KEY}&language=en-US`
		}

		// Just simply return the movie details (type is provided after clicking search result)

		log('Retrieving popup data')
		return `https://api.themoviedb.org/3/${optCurrentMedia}/${getId}?api_key=${API_KEY}&language=en-US`
	}
	// Default is discover
	log('Retrieving discover page')
	log(optCurrentMedia)
	return `https://api.themoviedb.org/3/discover/${optCurrentMedia}?api_key=${API_KEY}${filters}${sort}&page=${optPage}`
}

/**
 * Gets the media results array and passes this to showMedia()
 * @param {string} url the API url, use constructRequestUrl()
 */
async function getMedia(url) {
	setLoading(true)

	log(url)

	const res = await fetch(url)
	const data = await res.json()

	mobileMenu.classList.remove('open')
	mobileMenuOpener.classList.remove('open')

	maxPages = data.total_pages
	setPages()

	if (url.includes('multi')) showMedia(data.results, true)
	else showMedia(data.results)
}

/*
 *
 */
const main = document.getElementById('main')
/**
 * Clear the main and append each movie (those which have a poster)
 * @param {Array<Object>} medias
 * @param {boolean} isSearchResult indicates if the output is for search results
 */
function showMedia(medias, isSearchResult = false) {
	setLoading(false)
	main.innerHTML = ''

	medias.forEach((media) => {
		const { name, title, poster_path, vote_average, media_type } = media

		const mediaElement = document.createElement('div')
		mediaElement.classList.add('media')

		// If poster_path is null
		// continue
		if (!poster_path) {
			return true
		}

		// Set the innerHTML of the full div
		mediaElement.innerHTML = `
      <img src="${IMAGE_PATH + poster_path}" alt="${title}">
      <div class="info">
        <h3>${!title ? name : title}</h3>
      </div>
			<span class="${
				vote_average > 5 ? (vote_average > 8 ? 'green' : 'yellow') : 'red'
			}">${vote_average}</span>
			${
				isSearchResult
					? `<div class="icon">${
							media_type === 'tv'
								? '<i class="fas fa-tv"></i>'
								: '<i class="fas fa-film"></i>'
					  }</div>`
					: ''
			}
    `

		const btn = document.createElement('button')
		btn.classList.add('popup')
		btn.addEventListener('click', () => {
			CURRENT_MEDIA = media
			showPopup(CURRENT_MEDIA.media_type)
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
async function getCurrentMedia(id, mediaType = '') {
	const res = await fetch(
		constructRequestUrl(false, '', true, id, false, false, mediaType)
	)
	const data = await res.json()

	log(data)
	return data
}

/**
 * Get age classification (US Rating) from a movie
 * @param {number} id
 * @returns {Object[]}
 */
async function getMovieAgeClassification(id, mediaType = '') {
	// Skip the searching/searchTerm parameters,
	//  Then we are getting the movie classification (third-last boolean)
	//  false: not searching, '' : empty search term, true: retrieving from id, id: that id, true: get classification,
	// false: don't get cast, mediaType: the media type to retrieve (used in search results)
	const res = await fetch(
		constructRequestUrl(false, '', true, id, true, false, mediaType)
	)
	const data = await res.json()

	return data.results
}

/**
 * Get cast/crew of movie
 * @param {number} id
 * @param {string} mediaType
 * @returns {Object}
 */
async function getMovieCast(id, mediaType = '') {
	// Last true-boolean indicates we are fetching the cast
	const res = await fetch(
		constructRequestUrl(false, '', true, id, false, true, mediaType)
	)
	const data = await res.json()

	return data
}

/*
 *
 */
const popupDiv = document.getElementById('popup')
function showPopup(mediaType = '') {
	// reset scroll of infoAreaContainer (cast/mobile-plot views)
	infoAreaContainer.scrollTo(0, 0)

	// Disable scroll on the body
	disableScroll()

	if (_loading) {
		log('waiting for first task to complete')
		return
	}

	// mark loading as true
	setLoading(true)

	// Reset global popup-required variables
	_cast = {}
	_classification = ''
	_overview = ''

	getCurrentMedia(CURRENT_MEDIA.id, mediaType).then((mediaData) => {
		// Set the overview here
		_overview = mediaData.overview
		getMovieAgeClassification(CURRENT_MEDIA.id, mediaType).then(
			(ageClassResult) => {
				// Set the classification (age rating) here
				ageClassResult.forEach((releaseDates) => {
					if (releaseDates.iso_3166_1 === _locale) {
						if (
							mediaType === mediaTypes.movie ||
							optCurrentMedia === mediaTypes.movie
						) {
							_classification = releaseDates.release_dates[0].certification
						} else if (
							mediaType === mediaTypes.tv ||
							optCurrentMedia === mediaTypes.tv
						) {
							_classification = releaseDates.rating
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
						(mediaData.backdrop_path
							? mediaData.backdrop_path
							: mediaData.poster_path)
					}" class="exclude-margin"></img>
				</div>
				<div class="under-banner exclude-margin">
					<div class="top-info exclude-margin">
						<h3 class="title">${mediaData.title ? mediaData.title : mediaData.name}</h3>
						<div class="info-small exclude-margin">
							${
								_classification &&
								`<h4 class="classification exclude-margin">${_classification}</h4>`
							}
							<h4 class="release exclude-margin">${
								mediaData.release_date
									? mediaData.release_date
									: mediaData.first_air_date
									? mediaData.first_air_date
									: ''
							}</h4>
						</div>
					</div>
					<div class="tag exclude-margin"><h5>${
						mediaData.tagline ? `"${mediaData.tagline}"` : ''
					}</h5></div>
					<div class="sub-info">
						<div class="votes">
							<span class="average">
								<i class="fas fa-fire exclude-margin" alt="Average vote icon"></i>
								<span class="${
									mediaData.vote_average > 5
										? mediaData.vote_average > 8
											? 'green'
											: 'yellow'
										: 'red'
								} exclude-margin" alt="Average vote">${
					mediaData.vote_average ? mediaData.vote_average : '0'
				}</span>
							</span>
							<span class="total">
								<i class="fas fa-user exclude-margin" alt="Total votes icon"></i>
								<span class="count exclude-margin" alt="Total votes">${
									mediaData.vote_count ? mediaData.vote_count : 0
								}</span>
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
					showCast(CURRENT_MEDIA.id, mediaType)
				})
				buttons.appendChild(btnCast)

				// Mark loading as false again
				setLoading(false)
			}
		)
	})
}

const infoArea = document.getElementById('infoArea')
const infoCloseButton = document.getElementById('info-close-icon')

infoCloseButton.addEventListener('click', () => {
	infoArea.classList.remove('open')
})

const infoAreaContainer = infoArea.querySelector('.container')
const showCast = (id, mediaType = '') => {
	infoArea.classList.add('open')
	infoAreaContainer.classList.remove('plot')
	infoAreaContainer.classList.add('cast')
	setLoading(true)

	getMovieCast(id, mediaType).then((castData) => {
		setLoading(false)
		const { cast, crew } = castData

		// Initialise
		_cast = {
			director: {},
			cast: [],
		}

		// Get only the director first (if this is a movie)
		try {
			const result = crew.filter((obj) => {
				return obj.job === 'Director'
			})[0]

			_cast.director = {
				name: result.name,
				img: result.profile_path,
			}
		} catch (Error) {}

		// now push each person to the cast (max of 16 people)
		const MAX = 15
		cast.forEach((person) => {
			if (_cast.cast.length > 15) return true

			_cast.cast.push({
				name: person.name,
				role: person.character,
				img: person.profile_path,
			})
		})

		// render to DOM
		infoAreaContainer.innerHTML = ''

		// Only add director if it exists
		if (_cast.director.name) {
			infoAreaContainer.innerHTML += `
			<div class='director'>
				<img src='${
					_cast.director.img
						? IMAGE_PATH + _cast.director.img
						: './img/default-user.png'
				}' alt='Picture of ${_cast.director.name}'></img>
				<div class='name'>
					${_cast.director.name}
				</div>
				<div class='role'>
					Director
				</div>
			</div>`
		}

		_cast.cast.forEach((member, index) => {
			infoAreaContainer.innerHTML += `
			<div class='member${member.img ? ' with-image' : ''}' ${
				MAX === index ? 'style="padding-bottom: 12rem !important;"' : ''
			}>
				<img src='${
					member.img ? IMAGE_PATH + member.img : './img/default-user.png'
				}' alt='Picture of ${member.name}'></img>
				<div class='name'>
					${member.name}
				</div>
				<div class='role'>
					${member.role}
				</div>
			</div>`
		})

		if (_cast.cast.length === 0) {
			infoAreaContainer.innerHTML = "Couldn't find data for this one."
		}
	})
}
const showPlotMobile = () => {
	infoArea.classList.add('open')

	infoAreaContainer.classList.add('plot')
	infoAreaContainer.classList.remove('cast')

	infoAreaContainer.innerHTML = `${_overview}`
}

/*
 *
 */
const popupClose = document.getElementById('popup-close-icon')
popupClose.addEventListener('click', () => {
	popupDiv.classList.remove('open')
	enableScroll()
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
		log('Error searching')
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
		log('Error searching')
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
