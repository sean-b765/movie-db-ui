import { mobileMenu, mobileMenuOpener } from './ux.js'

const API_KEY = '6a2ae44babf3ff78b6e4d09363704281'
const IMAGE_PATH = 'https://image.tmdb.org/t/p/w1280'
const SEARCH_URL = `https://api.themoviedb.org/3/search/movie?&api_key=${API_KEY}&query=`

const form = document.getElementById('form')
const search = form.querySelector('#search')
const mobileForm = document.getElementById('mob-search')
const mobileSearch = mobileForm.querySelector('#search')

const main = document.getElementById('main')

const mediaSelectMovie = document.querySelectorAll('.media-select.movies')
const mediaSelectTv = document.querySelectorAll('.media-select.tv')

const sorts = {
	popularity: {
		desc: 'popularity.desc',
		asc: 'popularity.asc',
	},
}
const mediaTypes = {
	movie: 'movie',
	tv: 'tv',
	multi: 'multi',
}

// Default options
let currentMedia = mediaTypes.movie
let page = 1
let sortBy = sorts.popularity.desc
//

/**
 * Get a request URL with parameters
 * @param {boolean} searching true: searching, false: discovering
 * @param {string} searchTerm the term/s to search for
 * @returns {string} API URL
 */
const constructRequestUrl = (searching = false, searchTerm = '') => {
	if (searching && searchTerm !== '') {
		console.log('search')
		return `https://api.themoviedb.org/3/search/${currentMedia}?sort_by=${sortBy}&api_key=${API_KEY}&page=${page}&query="${searchTerm}"`
	} else {
		console.log('fetch')
		return `https://api.themoviedb.org/3/discover/${currentMedia}?sort_by=${sortBy}&api_key=${API_KEY}&page=${page}`
	}
}
// Get movies/tv
async function getMedia(url) {
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
		currentMedia = mediaTypes.movie
		// make the navbar option active
		item.classList.add('active')

		// Remove active class from tv (mobile/desktop navbar)
		mediaSelectTv.forEach((tv) => {
			tv.classList.remove('active')
		})

		// Refresh media
		getMedia(constructRequestUrl())
	})
})
mediaSelectTv.forEach((item) => {
	// Add click event to both desktop/mobile navbar tv options
	item.addEventListener('click', () => {
		currentMedia = mediaTypes.tv
		// Add active class
		item.classList.add('active')

		// Remove active class from movie (mobile/desktop navbar)
		mediaSelectMovie.forEach((movie) => {
			movie.classList.remove('active')
		})

		getMedia(constructRequestUrl())
	})
})

// Get media on page load
getMedia(constructRequestUrl())
