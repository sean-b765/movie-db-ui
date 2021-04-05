import { mobileMenu, mobileMenuOpener } from './header.js'

const API_KEY = '6a2ae44babf3ff78b6e4d09363704281'
const IMAGE_PATH = 'https://image.tmdb.org/t/p/w1280'

const form = document.getElementById('form')
const search = form.querySelector('#search')
const mobileForm = document.getElementById('mob-search')
const mobileSearch = mobileForm.querySelector('#search')

const filters = document.getElementById('filters')

const main = document.getElementById('main')

const mediaSelectMovie = document.querySelectorAll('.media-select.movies')
const mediaSelectTv = document.querySelectorAll('.media-select.tv')

/* Filters */
const release = document.getElementById('release')
const checkboxRelease = document.getElementById('doYearFilter')
const minRating = document.getElementById('minRating')
const maxRating = document.getElementById('maxRating')
const checkboxRating = document.getElementById('doRatingFilter')

const mediaTypes = {
	movie: 'movie',
	tv: 'tv',
	multi: 'multi',
}

// Default options
let optCurrentMedia = mediaTypes.movie
let optPage = 1
let optSortBy = 'popularity.desc'
let optFilters = {
	rating: {
		min: 0,
		max: 10,
	},
	releaseDate: 0,
}
//

/**
 * Get a request URL with parameters
 * @param {boolean} searching true: searching, false: discovering
 * @param {string} searchTerm the term/s to search for
 * @returns {string} API URL
 */
const constructRequestUrl = (searching = false, searchTerm = '') => {
	let filters = `${
		checkboxRelease.checked ? `&primary_release_year=${release.value}` : ''
	}${
		checkboxRating.checked
			? `&vote_average.gte=${minRating.value}&vote_average.lte=${maxRating.value}`
			: ''
	}`
	console.log(release.value)
	let sort = `&sort_by=${optSortBy}`

	console.log(filters, sort)

	if (searching && searchTerm !== '') {
		return `https://api.themoviedb.org/3/search/${optCurrentMedia}?${filters}${sort}&api_key=${API_KEY}&page=${optPage}&query="${searchTerm}"`
	} else {
		return `https://api.themoviedb.org/3/discover/${optCurrentMedia}?${filters}${sort}&api_key=${API_KEY}&page=${optPage}`
	}
}
// Get movies/tv
async function getMedia(url) {
	console.log(url)
	const res = await fetch(url)
	const data = await res.json()

	mobileMenu.classList.remove('open')
	mobileMenuOpener.classList.remove('open')
	showMedia(data.results)
}
// Clear the main and append each movie (those which have a poster)
function showMedia(medias) {
	main.innerHTML = ''

	medias.forEach((media) => {
		const { name, title, poster_path, vote_average, overview } = media

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
        <span class="${
					vote_average > 5 ? (vote_average > 8 ? 'green' : 'yellow') : 'red'
				}">${vote_average}</span>
      </div>
      <div class="overview">
        <h3>Overview</h3>
        ${overview}
      </div>
    `
		main.appendChild(mediaElement)
	})
}

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

filters.addEventListener('submit', (e) => {
	e.preventDefault()

	optFilters.rating.min = minRating.value
	optFilters.rating.max = maxRating.value

	getMedia(constructRequestUrl())
})

const order = document.getElementById('sortingOrder')
const comboBox = document.getElementById('sortingSelect')
comboBox.addEventListener('click', (e) => {
	optSortBy = e.target.value + '.' + order.value
	console.log(optSortBy)

	getMedia(constructRequestUrl())
})
order.addEventListener('click', (e) => {
	optSortBy = comboBox.value + '.' + e.target.value
	console.log(optSortBy)

	getMedia(constructRequestUrl())
})

// Get media on optoptPage load
getMedia(constructRequestUrl())
